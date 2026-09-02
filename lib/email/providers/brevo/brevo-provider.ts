import { EmailSendError, type EmailProvider } from '../../provider'
import type { EmailMessage, EmailSendResult } from '../../types'

/**
 * Brevo (ex-Sendinblue) adapter — v3 transactional Send API over raw `fetch`
 * (single `api-key` header POST), so there is no SDK dependency. The only
 * module in the repo that knows Brevo's wire format.
 *
 * Like the other adapters, any non-2xx response is a thrown `EmailSendError`.
 * 402 `not_enough_credits` / 429 → `failover` + `quotaExceeded`; 401/403
 * (bad key or account still under Brevo's own review) and 5xx → `failover`.
 */
const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email'

type BrevoAddress = { email: string; name?: string }

/** "Studio Gallery <no-reply@x.com>" → { name, email }; bare address → { email }. */
function parseAddress(value: string): BrevoAddress {
  const match = value.match(/^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/)
  if (match) {
    const [, name, email] = match
    return name ? { email, name } : { email }
  }
  return { email: value.trim() }
}

type BrevoErrorBody = { code?: string; message?: string }

export class BrevoProvider implements EmailProvider {
  readonly name = 'brevo' as const
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const payload = {
      sender: parseAddress(message.from),
      to: [parseAddress(message.to)],
      subject: message.subject,
      htmlContent: message.html,
      ...(message.text !== undefined ? { textContent: message.text } : {}),
      ...(message.replyTo !== undefined
        ? { replyTo: parseAddress(message.replyTo) }
        : {}),
    }

    let response: Response
    try {
      response = await fetch(BREVO_SEND_URL, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (cause) {
      throw new EmailSendError('brevo: network error', { cause, failover: true })
    }

    const body = (await response
      .json()
      .catch(() => null)) as (BrevoErrorBody & { messageId?: string }) | null

    if (!response.ok) {
      const quotaExceeded =
        response.status === 429 ||
        response.status === 402 ||
        body?.code === 'not_enough_credits'
      const failover =
        quotaExceeded ||
        response.status === 401 ||
        response.status === 403 ||
        response.status >= 500
      throw new EmailSendError(
        `brevo: ${body?.message ?? body?.code ?? `HTTP ${response.status}`}`,
        { cause: body, failover, quotaExceeded }
      )
    }

    return { id: body?.messageId ?? null }
  }
}
