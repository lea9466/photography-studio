import { PaymentError } from './errors'
import type { PaymentProvider } from './provider'
import type { PaymentProviderName } from './types'
import { PayMeProvider } from './providers/payme/payme-provider'
import { SumitProvider } from './providers/sumit/sumit-provider'

export function getConfiguredPaymentProviderName(): PaymentProviderName {
  const configured = process.env.PAYMENT_PROVIDER?.trim().toLowerCase()
  if (configured === 'payme') return 'payme'
  if (configured === 'sumit') return 'sumit'
  if (configured === 'grow') return 'grow'
  if (configured === 'stripe') return 'stripe'
  if (configured === 'tranzila') return 'tranzila'
  throw new PaymentError('provider_not_configured')
}

export function createPaymentProvider(name = getConfiguredPaymentProviderName()): PaymentProvider {
  if (name === 'payme') return new PayMeProvider()
  if (name === 'sumit') return new SumitProvider()

  // Future providers are valid domain names but do not have adapters yet.
  throw new PaymentError('provider_not_configured')
}
