export const EMAIL_PROVIDER_NAMES = ['resend'] as const
export type EmailProviderName = (typeof EMAIL_PROVIDER_NAMES)[number]

/**
 * The full payload every `send*` function in lib/email/resend.ts already
 * builds — kept provider-neutral so a new adapter only has to map these
 * fields onto its own SDK. `to`/`replyTo` are single addresses because that
 * is all the app ever passes today.
 */
export type EmailMessage = {
  from: string
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export type EmailSendResult = {
  /** Provider-side message id, when the provider returns one. */
  id: string | null
}
