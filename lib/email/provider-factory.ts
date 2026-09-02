import { FailoverEmailProvider } from './failover-email-provider'
import type { EmailProvider } from './provider'
import { MailjetProvider } from './providers/mailjet/mailjet-provider'
import { ResendProvider } from './providers/resend/resend-provider'
import type { EmailProviderName } from './types'

/**
 * Which backend to send through. Defaults to Resend; set `EMAIL_PROVIDER` to
 * swap it without touching any `send*` code. Mirrors
 * `getConfiguredPaymentProviderName()` in lib/payments/provider-factory.ts.
 */
export function getConfiguredEmailProviderName(): EmailProviderName {
  const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase()
  if (configured === 'mailjet') return 'mailjet'
  if (configured === 'resend') return 'resend'
  return 'resend'
}

/** A single provider with its own credentials, or null when they're missing. */
function buildSingleProvider(name: string): EmailProvider | null {
  if (name === 'resend') {
    const apiKey = process.env.RESEND_API_KEY
    return apiKey ? new ResendProvider(apiKey) : null
  }
  if (name === 'mailjet') {
    const apiKey = process.env.MAILJET_API_KEY
    const secretKey = process.env.MAILJET_SECRET_KEY
    return apiKey && secretKey ? new MailjetProvider(apiKey, secretKey) : null
  }
  return null
}

function failoverCooldownMs(): number | undefined {
  const raw = Number(process.env.EMAIL_FAILOVER_COOLDOWN_MINUTES)
  return Number.isFinite(raw) && raw > 0 ? raw * 60 * 1000 : undefined
}

/**
 * Returns the send path, or `null` when nothing is configured —
 * `requireEmailProviderOrSafeStub` in lib/email/resend.ts turns `null` into a
 * hard failure in production and a redacted stub log in development.
 *
 * With `EMAIL_FALLBACK_PROVIDER` set (and both providers' keys present) the
 * result is a `FailoverEmailProvider`: the primary is tried first, and a
 * quota / rate-limit / 5xx failure rolls over to the fallback. Unset →
 * a single provider, identical to before.
 */
export function createEmailProvider(
  name = getConfiguredEmailProviderName()
): EmailProvider | null {
  const primary = buildSingleProvider(name)

  const fallbackName = process.env.EMAIL_FALLBACK_PROVIDER?.trim().toLowerCase()
  const fallback =
    fallbackName && fallbackName !== name ? buildSingleProvider(fallbackName) : null

  const chain = [primary, fallback].filter((p): p is EmailProvider => p !== null)
  if (chain.length === 0) return null
  if (chain.length === 1) return chain[0]
  return new FailoverEmailProvider(chain, { cooldownMs: failoverCooldownMs() })
}
