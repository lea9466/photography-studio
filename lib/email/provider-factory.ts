import type { EmailProvider } from './provider'
import { ResendProvider } from './providers/resend/resend-provider'
import type { EmailProviderName } from './types'

/**
 * Which backend to send through. Defaults to Resend — set `EMAIL_PROVIDER`
 * only once a second adapter exists. Mirrors
 * `getConfiguredPaymentProviderName()` in lib/payments/provider-factory.ts.
 */
export function getConfiguredEmailProviderName(): EmailProviderName {
  const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase()
  if (configured === 'resend') return 'resend'
  return 'resend'
}

/**
 * Returns the configured provider, or `null` when it has no credentials —
 * the caller (`requireEmailProviderOrSafeStub` in lib/email/resend.ts)
 * turns `null` into a hard failure in production and a redacted stub log in
 * development, exactly as the old `getResend()` did.
 */
export function createEmailProvider(
  name = getConfiguredEmailProviderName()
): EmailProvider | null {
  if (name === 'resend') {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return null
    return new ResendProvider(apiKey)
  }

  return null
}
