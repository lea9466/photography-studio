import 'server-only'

import { PaymentError } from '../../errors'
import type { PayMeEnvironment } from './payme-types'

const DEFAULT_TIMEOUT_MS = 10_000

function required(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim()
  if (!value) throw new PaymentError('provider_not_configured')
  return value
}

export function readPayMeEnvironment(): PayMeEnvironment {
  const apiBaseUrl = required('PAYME_API_BASE_URL')
  let parsed: URL
  try {
    parsed = new URL(apiBaseUrl)
  } catch {
    throw new PaymentError('provider_not_configured')
  }

  if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new PaymentError('provider_not_configured')
  }

  return {
    apiBaseUrl: parsed.toString().replace(/\/$/, ''),
    apiKey: required('PAYME_API_KEY'),
    sellerId: required('PAYME_SELLER_ID'),
    webhookSecret: required('PAYME_WEBHOOK_SECRET'),
  }
}

export class PayMeClient {
  constructor(
    private readonly environment = readPayMeEnvironment(),
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) {}

  get credentials() {
    return {
      apiKey: this.environment.apiKey,
      sellerId: this.environment.sellerId,
    }
  }

  async request<T>(path: string, init: RequestInit): Promise<T> {
    // TODO(PayMe): Call this only after the official authentication headers,
    // endpoint path and payload contract have been verified.
    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new PaymentError('invalid_request')
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(`${this.environment.apiBaseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new PaymentError('provider_unavailable', { status: 502 })
      }

      return (await response.json()) as T
    } catch (error) {
      if (error instanceof PaymentError) throw error
      throw new PaymentError('provider_unavailable', { cause: error })
    } finally {
      clearTimeout(timer)
    }
  }
}
