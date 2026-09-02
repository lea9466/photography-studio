import { EmailSendError, type EmailProvider } from '../../provider'
import type { EmailMessage, EmailSendResult } from '../../types'

/**
 * Mailjet adapter — talks to the v3.1 Send API directly over `fetch`
 * (a single Basic-auth POST), so there is no `node-mailjet` dependency.
 * The only module in the repo that knows Mailjet's wire format.
 *
 * Like `ResendProvider`, a non-2xx response — or a 2xx whose per-message
 * `Status` is not `"success"` — is surfaced as a thrown `EmailSendError`.
 */
const MAILJET_SEND_URL = 'https://api.mailjet.com/v3.1/send'

type MailjetAddress = { Email: string; Name?: string }

/** "Studio Gallery <no-reply@x.com>" → { Name, Email }; bare address → { Email }. */
function parseAddress(value: string): MailjetAddress {
  const match = value.match(/^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/)
  if (match) {
    const [, name, email] = match
    return name ? { Email: email, Name: name } : { Email: email }
  }
  return { Email: value.trim() }
}

type MailjetError = { ErrorMessage?: string; ErrorCode?: string }
type MailjetMessageResult = {
  Status?: string
  Errors?: MailjetError[]
  To?: Array<{ MessageID?: number; MessageUUID?: string }>
}
type MailjetSendResponse = {
  Messages?: MailjetMessageResult[]
  ErrorMessage?: string
  ErrorCode?: string
}

/** Best-effort human-readable reason from any Mailjet response shape. */
function describeFailure(
  body: MailjetSendResponse | null,
  fallback: string
): string {
  if (!body) return fallback
  if (body.ErrorMessage) return body.ErrorMessage
  const perMessage = body.Messages?.[0]?.Errors?.map((e) => e.ErrorMessage)
    .filter(Boolean)
    .join('; ')
  return perMessage || body.Messages?.[0]?.Status || fallback
}

export class MailjetProvider implements EmailProvider {
  readonly name = 'mailjet' as const
  private readonly authHeader: string

  constructor(apiKey: string, secretKey: string) {
    this.authHeader = `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const payload = {
      Messages: [
        {
          From: parseAddress(message.from),
          To: [parseAddress(message.to)],
          Subject: message.subject,
          HTMLPart: message.html,
          ...(message.text !== undefined ? { TextPart: message.text } : {}),
          ...(message.replyTo !== undefined
            ? { ReplyTo: parseAddress(message.replyTo) }
            : {}),
        },
      ],
    }

    let response: Response
    try {
      response = await fetch(MAILJET_SEND_URL, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (cause) {
      throw new EmailSendError('mailjet: network error', { cause })
    }

    const body = (await response
      .json()
      .catch(() => null)) as MailjetSendResponse | null

    if (!response.ok) {
      throw new EmailSendError(
        `mailjet: ${describeFailure(body, `HTTP ${response.status}`)}`,
        { cause: body }
      )
    }

    const result = body?.Messages?.[0]
    if (result?.Status && result.Status !== 'success') {
      throw new EmailSendError(
        `mailjet: ${describeFailure(body, result.Status)}`,
        { cause: body }
      )
    }

    return { id: result?.To?.[0]?.MessageUUID ?? null }
  }
}
