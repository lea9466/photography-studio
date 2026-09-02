import { Resend } from 'resend'

import { EmailSendError, type EmailProvider } from '../../provider'
import type { EmailMessage, EmailSendResult } from '../../types'

/**
 * Resend adapter — the only module in the repo that imports `resend`.
 *
 * `client.emails.send()` resolves with `{ data, error }` and does NOT throw
 * on an API-level failure (unverified domain, rate limit, bad recipient).
 * We surface that as a thrown `EmailSendError` so callers — the reminder
 * cron in particular, which otherwise records the email as sent — see the
 * failure.
 *
 * Quota / rate-limit / 5xx errors are tagged `failover` (and quota ones
 * `quotaExceeded`) so `FailoverEmailProvider` can move to the next provider.
 * Error names come from Resend's `RESEND_ERROR_CODE_KEY`.
 */
const RESEND_QUOTA_ERRORS = new Set([
  'daily_quota_exceeded',
  'monthly_quota_exceeded',
])
const RESEND_TRANSIENT_ERRORS = new Set([
  'rate_limit_exceeded',
  'internal_server_error',
  'application_error',
])

export class ResendProvider implements EmailProvider {
  readonly name = 'resend' as const
  private readonly client: Resend

  constructor(apiKey: string) {
    this.client = new Resend(apiKey)
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const { data, error } = await this.client.emails.send({
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.text !== undefined ? { text: message.text } : {}),
      ...(message.replyTo !== undefined ? { replyTo: message.replyTo } : {}),
    })

    if (error) {
      const quotaExceeded = RESEND_QUOTA_ERRORS.has(error.name)
      const failover =
        quotaExceeded ||
        RESEND_TRANSIENT_ERRORS.has(error.name) ||
        (error.statusCode != null && error.statusCode >= 500)
      throw new EmailSendError(`resend: ${error.name} — ${error.message}`, {
        cause: error,
        failover,
        quotaExceeded,
      })
    }

    return { id: data?.id ?? null }
  }
}
