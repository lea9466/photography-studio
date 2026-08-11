import { PaymentError } from '../../errors'
import type {
  CheckoutSession,
  PaymentCustomer,
  PaymentSubscription,
  WebhookEvent,
} from '../../types'
import type {
  PayMeCallbackIdentifiers,
  PayMeGenerateSubscriptionResponse,
  PayMeNotifyType,
  PayMeSubscriptionRecord,
} from './payme-types'
import { PAYME_NOTIFY_TYPES } from './payme-types'
function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

export function mapPayMeCustomer(input: {
  userId: string
  email: string
}): PaymentCustomer {
  // PayMe hosted subscription flow does not require a separate create-customer call.
  return {
    id: `payme-local:${input.userId}`,
    provider: 'payme',
    email: input.email,
  }
}

export function mapPayMeCheckoutFromGenerate(
  payload: PayMeGenerateSubscriptionResponse
): CheckoutSession {
  const url = asString(payload.sub_url)
  if (!url) throw new PaymentError('provider_unavailable')

  return {
    id: asString(payload.sub_payme_id) ?? 'payme-checkout',
    provider: 'payme',
    url,
    token: null,
    expiresAt: null,
  }
}

/**
 * Maps a subscription record without interpreting numeric sub_status.
 * Local status stays `pending` until the official status table is confirmed.
 */
export function mapPayMeSubscriptionRecord(
  record: PayMeSubscriptionRecord
): PaymentSubscription {
  const externalId = asString(record.sub_payme_id)
  if (!externalId) throw new PaymentError('verification_failed')

  return {
    id: externalId,
    provider: 'payme',
    customerId: null,
    planId: null,
    // Intentionally not derived from sub_status (UNKNOWN numeric table).
    status: 'pending',
    currentPeriodStart: asString(record.sub_start_date),
    currentPeriodEnd: asString(record.sub_next_date),
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    nextPaymentAt: asString(record.sub_next_date),
    metadata: {
      subscription_id: record.subscription_id ?? null,
      payme_sub_code: record.payme_sub_code ?? record.sub_payme_code ?? null,
      sub_status_raw: record.sub_status ?? null,
      sub_paid: record.sub_paid ?? null,
      sub_price: record.sub_price ?? null,
      sub_currency: record.sub_currency ?? null,
      sub_iteration_type: record.sub_iteration_type ?? null,
      // Intentionally omit sub_buyer_details — never persist card/social PII.
    },
  }
}

export function isPayMeNotifyType(value: unknown): value is PayMeNotifyType {
  return (
    typeof value === 'string' &&
    (PAYME_NOTIFY_TYPES as readonly string[]).includes(value)
  )
}

export function extractPayMeCallbackIdentifiers(
  payload: Record<string, unknown>
): PayMeCallbackIdentifiers {
  const notifyRaw = payload.notify_type
  const notifyType = isPayMeNotifyType(notifyRaw) ? notifyRaw : 'unknown'

  return {
    notifyType,
    subscriptionId: asString(payload.subscription_id),
    subPaymeId: asString(payload.sub_payme_id),
    subPaymeCode:
      typeof payload.sub_payme_code === 'string' ||
      typeof payload.sub_payme_code === 'number'
        ? payload.sub_payme_code
        : null,
    paymeSaleId: asString(payload.payme_sale_id),
    sellerPaymeId: asString(payload.seller_payme_id),
    raw: payload,
  }
}

/**
 * Lifecycle activation/cancel/pause mapping stays fail-closed:
 * every callback is normalized to `unknown` until S2S + sub_status are wired.
 * Identifiers are preserved for inbox scaffolding only.
 */
export function mapPayMeWebhookIdentifiersToEvent(
  identifiers: PayMeCallbackIdentifiers,
  eventId: string
): WebhookEvent {
  return {
    id: eventId,
    provider: 'payme',
    type: 'unknown',
    occurredAt: new Date().toISOString(),
    externalCustomerId: null,
    externalSubscriptionId: identifiers.subPaymeId,
    externalTransactionId: identifiers.paymeSaleId,
    rawPayload: {
      notify_type: identifiers.notifyType,
      subscription_id: identifiers.subscriptionId,
      sub_payme_id: identifiers.subPaymeId,
      sub_payme_code: identifiers.subPaymeCode,
      payme_sale_id: identifiers.paymeSaleId,
      seller_payme_id: identifiers.sellerPaymeId,
      lifecycle_mapping: 'blocked_until_sub_status_confirmed',
      ...sanitizeCallbackForInbox(identifiers.raw),
    },
    data: {},
  }
}

const SENSITIVE_CALLBACK_KEYS = new Set([
  'buyer_social_id',
  'buyer_card_mask',
  'credit_card_number',
  'credit_card_cvv',
  'credit_card_exp',
  'buyer_card_exp',
  'payme_signature',
])

function sanitizeCallbackForInbox(
  raw: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (SENSITIVE_CALLBACK_KEYS.has(key)) continue
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value
    }
  }
  return out
}

/** @deprecated placeholder kept for older tests — checkout mapping requires generate response. */
export function mapPayMeCheckout(_payload: unknown): CheckoutSession {
  throw new PaymentError('provider_not_configured')
}
