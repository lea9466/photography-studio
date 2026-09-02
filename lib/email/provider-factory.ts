import { FailoverEmailProvider } from './failover-email-provider'
import type { EmailProvider } from './provider'
import { BrevoProvider } from './providers/brevo/brevo-provider'
import { MailjetProvider } from './providers/mailjet/mailjet-provider'
import { ResendProvider } from './providers/resend/resend-provider'
import { EMAIL_PROVIDER_NAMES, type EmailProviderName } from './types'

/**
 * Which backend to send through. Defaults to Resend; set `EMAIL_PROVIDER` to
 * swap it without touching any `send*` code. Mirrors
 * `getConfiguredPaymentProviderName()` in lib/payments/provider-factory.ts.
 */
export function getConfiguredEmailProviderName(): EmailProviderName {
  const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase()
  const match = EMAIL_PROVIDER_NAMES.find((n) => n === configured)
  return match ?? 'resend'
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
  if (name === 'brevo') {
    const apiKey = process.env.BREVO_API_KEY
    return apiKey ? new BrevoProvider(apiKey) : null
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
 * `EMAIL_FALLBACK_PROVIDER` may name one provider or a comma-separated list
 * (`mailjet,brevo`). With at least one usable fallback the result is a
 * `FailoverEmailProvider` — the primary is tried first, and a quota /
 * rate-limit / 5xx / auth failure rolls over down the list. Unset → a single
 * provider, identical to before.
 */
export function createEmailProvider(
  name = getConfiguredEmailProviderName()
): EmailProvider | null {
  const seen = new Set<string>([name])
  const chain: EmailProvider[] = []

  const primary = buildSingleProvider(name)
  if (primary) chain.push(primary)

  for (const raw of (process.env.EMAIL_FALLBACK_PROVIDER ?? '').split(',')) {
    const fallbackName = raw.trim().toLowerCase()
    if (!fallbackName || seen.has(fallbackName)) continue
    seen.add(fallbackName)
    const provider = buildSingleProvider(fallbackName)
    if (provider) chain.push(provider)
  }

  if (chain.length === 0) return null
  if (chain.length === 1) return chain[0]
  return new FailoverEmailProvider(chain, { cooldownMs: failoverCooldownMs() })
}
