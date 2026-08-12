import { PaymentError } from '../../errors'
import type {
  PayMeEnvironment,
  PayMeGetSubscriptionsRequest,
  PayMeGetSubscriptionsResponse,
  PayMeGetTransactionsRequest,
  PayMeGetTransactionsResponse,
} from './payme-types'
import {
  PAYME_LIVE_HOST,
  PAYME_SANDBOX_API_BASE_URL,
  PAYME_PRODUCTION_API_BASE_URL,
} from './payme-types'

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

function assertPayMeEnvironment(apiBaseUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(apiBaseUrl)
  } catch {
    throw new PaymentError('provider_not_configured')
  }

  if (parsed.protocol !== 'https:') {
    throw new PaymentError('provider_not_configured')
  }

  const paymeEnv = process.env.PAYME_ENV?.trim().toLowerCase()
  if (
    paymeEnv !== undefined &&
    paymeEnv !== 'sandbox' &&
    paymeEnv !== 'production'
  ) {
    throw new PaymentError('provider_not_configured')
  }

  const host = parsed.hostname.toLowerCase()
  const normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '')

  if (paymeEnv === 'production') {
    if (host !== PAYME_LIVE_HOST) {
      throw new PaymentError('provider_not_configured')
    }
    if (normalized !== PAYME_PRODUCTION_API_BASE_URL) {
      throw new PaymentError('provider_not_configured')
    }
    return new URL(PAYME_PRODUCTION_API_BASE_URL)
  }

  // Default sandbox behavior when PAYME_ENV is unset.
  if (host === PAYME_LIVE_HOST || host.endsWith(`.${PAYME_LIVE_HOST}`)) {
    throw new PaymentError('provider_not_configured')
  }
  if (host !== 'sandbox.payme.io') {
    throw new PaymentError('provider_not_configured')
  }
  if (normalized !== PAYME_SANDBOX_API_BASE_URL) {
    throw new PaymentError('provider_not_configured')
  }

  return new URL(PAYME_SANDBOX_API_BASE_URL)
}

export function readPayMeEnvironment(): PayMeEnvironment {
  const configuredBase =
    process.env.PAYME_API_BASE_URL?.trim() || PAYME_SANDBOX_API_BASE_URL
  const parsed = assertPayMeEnvironment(configuredBase)

  const paymeEnv = process.env.PAYME_ENV?.trim().toLowerCase()
  const env =
    paymeEnv === 'production'
      ? 'production'
      : 'sandbox'

  return {
    apiBaseUrl: parsed.toString().replace(/\/$/, ''),
    clientKey: optional('PAYME_CLIENT_KEY'),
    sellerId: required('PAYME_SELLER_ID'),
    webhookSecret: optional('PAYME_WEBHOOK_SECRET'),
    env,
  }
}

export class PayMeClient {
  constructor(
    private readonly environment = readPayMeEnvironment(),
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) { }

  get credentials() {
    return {
      clientKey: this.environment.clientKey,
      sellerId: this.environment.sellerId,
      apiBaseUrl: this.environment.apiBaseUrl,
      env: this.environment.env,
    }
  }

  async getSubscriptions(
    filters: Omit<
      PayMeGetSubscriptionsRequest,
      'payme_client_key' | 'seller_payme_id'
    > = {}
  ): Promise<PayMeGetSubscriptionsResponse> {
    return this.postJson<PayMeGetSubscriptionsResponse>('/get-subscriptions', {
      ...(this.environment.clientKey ? { payme_client_key: this.environment.clientKey } : {}),
      seller_payme_id: this.environment.sellerId,
      ...filters,
    })
  }

  async getTransactions(
    filters: Omit<
      PayMeGetTransactionsRequest,
      'payme_client_key' | 'seller_payme_id'
    > = {}
  ): Promise<PayMeGetTransactionsResponse> {
    return this.postJson<PayMeGetTransactionsResponse>('/get-transactions', {
      ...(this.environment.clientKey ? { payme_client_key: this.environment.clientKey } : {}),
      seller_payme_id: this.environment.sellerId,
      ...filters,
    })
  }

  async postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new PaymentError('invalid_request')
    }

    // Temporary trace: if this is the live generate-subscription endpoint,
    // stop here to avoid sending real requests during tracing.
    try {
      const normalizedBase = this.environment.apiBaseUrl.replace(/\/$/, '')
      if (
        normalizedBase === PAYME_PRODUCTION_API_BASE_URL &&
        path === '/generate-subscription'
      ) {
        console.error('[payments-trace][payme-client] reached-generate-subscription', {
          step: 'postJson',
          note: 'TRACE_STOP_BEFORE_POST',
          apiBaseUrl: 'live.payme.io',
          path,
        })
        // Signal to the caller that we'd reach PayMe; do not perform network I/O.
        const e = new Error('PAYME_TRACE_STOP: would POST to PayMe')
        e.name = 'PAYME_TRACE_STOP'
        throw e
      }
    } catch (__) {
      // continue to normal behavior if any issue determining trace condition
    }

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
          body: JSON.stringify(body),
          signal: controller.signal,
          cache: 'no-store',
        })

        if (response.status >= 500 || response.status === 429) {
          lastError = new PaymentError('provider_unavailable', { status: 502 })
          if (attempt < MAX_ATTEMPTS) {
            await sleep(RETRY_BASE_DELAY_MS * attempt)
            continue
          }
          throw lastError
        }

        if (!response.ok) {
          throw new PaymentError('provider_unavailable', { status: 502 })
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

export function firstSubscriptionRecord(
  response: PayMeGetSubscriptionsResponse
) {
  if (Array.isArray(response.items) && response.items[0]) return response.items[0]
  return null
}

export function firstTransactionRecord(response: PayMeGetTransactionsResponse) {
  if (Array.isArray(response.items) && response.items[0]) return response.items[0]
  if (Array.isArray(response.transactions) && response.transactions[0]) {
    return response.transactions[0]
  }
  if (response.payme_sale_id || response.payme_transaction_id || response.sale_status) {
    return response
  }
  return null
}
