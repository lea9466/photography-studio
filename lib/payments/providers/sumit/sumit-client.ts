import { PaymentError } from '../../errors'
import type { SumitCredentials, SumitEnvironment } from './sumit-types'
import { SUMIT_API_BASE_URL, SUMIT_LIVE_HOST } from './sumit-types'

const DEFAULT_TIMEOUT_MS = 10_000
const MAX_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 200

function required(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim()
  if (!value) throw new PaymentError('provider_not_configured')
  return value
}

function optional(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim()
  return value || null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * SUMIT has no separate sandbox host (unlike PayMe's sandbox.payme.io), so the
 * only safe fail-closed check is HTTPS + the exact production host.
 */
function assertSumitEnvironment(apiBaseUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(apiBaseUrl)
  } catch {
    throw new PaymentError('provider_not_configured')
  }

  if (parsed.protocol !== 'https:') {
    throw new PaymentError('provider_not_configured')
  }

  const normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '')
  if (parsed.hostname.toLowerCase() !== SUMIT_LIVE_HOST || normalized !== SUMIT_API_BASE_URL) {
    throw new PaymentError('provider_not_configured')
  }

  return new URL(SUMIT_API_BASE_URL)
}

export function readSumitEnvironment(): SumitEnvironment {
  const configuredBase = process.env.SUMIT_API_BASE_URL?.trim() || SUMIT_API_BASE_URL
  const parsed = assertSumitEnvironment(configuredBase)

  return {
    apiBaseUrl: parsed.toString().replace(/\/$/, ''),
    companyId: required('SUMIT_COMPANY_ID'),
    apiKey: required('SUMIT_API_KEY'),
    publicKey: optional('SUMIT_PUBLIC_KEY'),
    testMode: process.env.SUMIT_TEST_MODE === 'true',
  }
}

export class SumitClient {
  constructor(
    private readonly environment = readSumitEnvironment(),
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) {}

  get credentials(): SumitCredentials {
    return {
      CompanyID: Number(this.environment.companyId),
      APIKey: this.environment.apiKey,
    }
  }

  get env() {
    return this.environment
  }

  /**
   * SUMIT always answers HTTP 200 and reports failure via a `Status` field in
   * the JSON body (Status === 0 means success) — unlike PayMe, a non-2xx HTTP
   * status here means a transport/gateway failure, not a declined charge.
   * Callers are responsible for checking `Status` themselves.
   */
  async postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new PaymentError('invalid_request')
    }

    const fullBody = { Credentials: this.credentials, ...body }

    let lastError: unknown
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const response = await fetch(`${this.environment.apiBaseUrl}${path}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fullBody),
          signal: controller.signal,
          cache: 'no-store',
        })

        if (response.status >= 500 || response.status === 429) {
          const bodyText = await response.text().catch(() => '')
          lastError = new PaymentError('provider_unavailable', {
            status: 422,
            cause: `[${response.status}] ${path} ${bodyText}`,
          })
          if (attempt < MAX_ATTEMPTS) {
            await sleep(RETRY_BASE_DELAY_MS * attempt)
            continue
          }
          throw lastError
        }

        if (!response.ok) {
          const bodyText = await response.text().catch(() => '')
          throw new PaymentError('provider_unavailable', {
            status: 422,
            cause: `[${response.status}] ${path} ${bodyText}`,
          })
        }

        return (await response.json()) as T
      } catch (error) {
        if (error instanceof PaymentError) throw error
        lastError = error
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_BASE_DELAY_MS * attempt)
          continue
        }
        throw new PaymentError('provider_unavailable', { cause: lastError })
      } finally {
        clearTimeout(timer)
      }
    }

    throw new PaymentError('provider_unavailable', { cause: lastError })
  }
}
