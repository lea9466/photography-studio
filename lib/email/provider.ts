import type { EmailMessage, EmailProviderName, EmailSendResult } from './types'

/**
 * A single email backend. Mirrors the shape of `PaymentProvider`
 * (lib/payments/provider.ts): a named adapter with one job.
 *
 * `send` must reject when the provider did not accept the message — a
 * resolved promise means the email was handed off successfully. Adapters
 * are responsible for translating "soft" provider errors (an `{ error }`
 * field on an otherwise-resolved SDK call, say) into a thrown error.
 */
export interface EmailProvider {
  readonly name: EmailProviderName
  send(message: EmailMessage): Promise<EmailSendResult>
}

/** Raised by an adapter when the provider rejected the send. */
export class EmailSendError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'EmailSendError'
  }
}
