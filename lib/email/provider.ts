import type { EmailMessage, EmailSendResult } from './types'

/**
 * A single email backend. Mirrors the shape of `PaymentProvider`
 * (lib/payments/provider.ts): a named adapter with one job.
 *
 * `send` must reject when the provider did not accept the message — a
 * resolved promise means the email was handed off successfully. Adapters
 * are responsible for translating "soft" provider errors (an `{ error }`
 * field on an otherwise-resolved SDK call, say) into a thrown error.
 *
 * `name` is diagnostic only (logs). It's a real `EmailProviderName` for the
 * concrete adapters and `'failover'` for the composite.
 */
export interface EmailProvider {
  readonly name: string
  send(message: EmailMessage): Promise<EmailSendResult>
}

/**
 * Raised by an adapter when the provider rejected the send.
 *
 * `failover` — the send is worth retrying on a *different* provider (quota,
 * rate limit, 5xx, network). Left `false` for errors another provider won't
 * fix (bad recipient, unverified `from`).
 * `quotaExceeded` — a daily/monthly allowance ran out, so `FailoverEmailProvider`
 * should also put this provider on cooldown rather than just retry once.
 */
export class EmailSendError extends Error {
  readonly failover: boolean
  readonly quotaExceeded: boolean

  constructor(
    message: string,
    options?: { cause?: unknown; failover?: boolean; quotaExceeded?: boolean }
  ) {
    super(message, options)
    this.name = 'EmailSendError'
    this.failover = options?.failover ?? false
    this.quotaExceeded = options?.quotaExceeded ?? false
  }
}
