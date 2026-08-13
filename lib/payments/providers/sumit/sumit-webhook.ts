import { createHash } from 'node:crypto'
import { PaymentError } from '../../errors'
import type { ParseWebhookInput, WebhookEvent } from '../../types'

/**
 * SUMIT does not send an async payment/subscription lifecycle webhook by
 * default (confirmed against SUMIT's own Laravel SDK: its "SumitWebhookController"
 * only receives optional CRM "Triggers" events — card created/updated/deleted —
 * which require manually configuring a View + Trigger in the SUMIT dashboard,
 * and are not standard payment notifications). Recurring charge confirmation is
 * only available via the synchronous S2S response of /billing/recurring/charge/.
 *
 * This parser stays fail-closed exactly like PayMe's current
 * `mapPayMeWebhookIdentifiersToEvent`: every callback is logged to the inbox
 * (`payment_webhook_events`) as `type: 'unknown'` and never activates a
 * subscription on its own. Do not change this without first confirming SUMIT's
 * Trigger payload shape and configuring the dashboard-side Trigger.
 */
export async function parseSumitWebhook(input: ParseWebhookInput): Promise<WebhookEvent> {
  const header = input.headers.get('content-type') ?? ''
  const isJson = header.toLowerCase().split(';')[0]?.trim() === 'application/json'
  if (!isJson) {
    throw new PaymentError('invalid_webhook')
  }

  if (input.rawBody.byteLength === 0 || input.rawBody.byteLength > 1_000_000) {
    throw new PaymentError('invalid_webhook')
  }

  const text = new TextDecoder('utf-8').decode(input.rawBody)
  let payload: Record<string, unknown>
  try {
    const parsed = JSON.parse(text) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object')
    }
    payload = parsed as Record<string, unknown>
  } catch {
    throw new PaymentError('invalid_webhook')
  }

  const eventId = `sumit:${createHash('sha256').update(input.rawBody).digest('hex').slice(0, 32)}`

  return {
    id: eventId,
    provider: 'sumit',
    type: 'unknown',
    occurredAt: new Date().toISOString(),
    externalCustomerId: null,
    externalSubscriptionId: null,
    externalTransactionId: null,
    rawPayload: {
      lifecycle_mapping: 'blocked_no_confirmed_sumit_payment_webhook',
      ...sanitizeForInbox(payload),
    },
    data: {},
  }
}

const SENSITIVE_KEYS = new Set([
  'CreditCard_Number',
  'CreditCard_CVV',
  'CreditCard_Token',
  'CardNumber',
  'CVV',
])

function sanitizeForInbox(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (SENSITIVE_KEYS.has(key)) continue
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value
    }
  }
  return out
}
