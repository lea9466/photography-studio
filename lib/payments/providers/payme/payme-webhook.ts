import { createHash } from 'node:crypto'
import { PaymentError } from '../../errors'
import type { ParseWebhookInput, WebhookEvent } from '../../types'
import {
  isAllowedPayMeCallbackContentType,
  PAYME_CALLBACK_CONTENT_TYPE,
  type PayMeCallbackContentType,
} from './payme-callback-config'
import {
  extractPayMeCallbackIdentifiers,
  mapPayMeWebhookIdentifiersToEvent,
} from './payme-mapper'

export type ParsePayMeWebhookOptions = {
  /**
   * Optional override for tests. Production uses PAYME_CALLBACK_CONTENT_TYPE.
   */
  configuredContentType?: PayMeCallbackContentType | null
}

/**
 * Parses an untrusted PayMe callback.
 *
 * Content-Type must match the official form-urlencoded callback format.
 * Any mismatch is rejected fail-closed.
 *
 * Signature verification is reserved for a future payme_signature algorithm.
 */
export async function parsePayMeWebhook(
  input: ParseWebhookInput,
  options: ParsePayMeWebhookOptions = {}
): Promise<WebhookEvent> {
  const configured =
    options.configuredContentType !== undefined
      ? options.configuredContentType
      : PAYME_CALLBACK_CONTENT_TYPE

  const header = input.headers.get('content-type')
  if (!isAllowedPayMeCallbackContentType(header, configured)) {
    throw new PaymentError('invalid_webhook')
  }

  const payload = parseCallbackBody(input.rawBody, configured!)
  validateCallbackPayload(payload)
  const identifiers = extractPayMeCallbackIdentifiers(payload)
  const eventId = buildDeterministicEventId(identifiers, input.rawBody)

  // Lifecycle activation stays fail-closed (unknown) until A + S2S are wired.
  return mapPayMeWebhookIdentifiersToEvent(identifiers, eventId)
}

function validateCallbackPayload(payload: Record<string, unknown>): void {
  const notifyType = payload.notify_type
  if (typeof notifyType !== 'string' || notifyType.trim() === '') {
    throw new PaymentError('invalid_webhook')
  }

  const hasCorrelation = [
    payload.subscription_id,
    payload.sub_payme_id,
    payload.payme_sale_id,
    payload.seller_payme_id,
    payload.sub_payme_code,
  ].some((value) => isMeaningfulValue(value))

  if (!hasCorrelation) {
    throw new PaymentError('invalid_webhook')
  }
}

function isMeaningfulValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  return false
}

function parseCallbackBody(
  rawBody: Uint8Array,
  configured: PayMeCallbackContentType
): Record<string, unknown> {
  if (rawBody.byteLength === 0 || rawBody.byteLength > 1_000_000) {
    throw new PaymentError('invalid_webhook')
  }

  const text = new TextDecoder('utf-8').decode(rawBody)

  if (configured === 'application/x-www-form-urlencoded') {
    return parseFormUrlEncoded(text)
  }

  if (configured === 'application/json') {
    return parseJsonObject(text)
  }

  throw new PaymentError('invalid_webhook')
}

function parseJsonObject(text: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new PaymentError('invalid_webhook')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new PaymentError('invalid_webhook')
  }
  return parsed as Record<string, unknown>
}

function parseFormUrlEncoded(text: string): Record<string, unknown> {
  const params = new URLSearchParams(text)
  const out: Record<string, unknown> = {}
  for (const [key, value] of params.entries()) {
    out[key] = coerceScalar(value)
  }
  if (Object.keys(out).length === 0) {
    throw new PaymentError('invalid_webhook')
  }
  return out
}

function coerceScalar(value: string): string | number | boolean {
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^-?\d+$/.test(value)) {
    const asNumber = Number(value)
    if (Number.isSafeInteger(asNumber)) return asNumber
  }
  return value
}

function buildDeterministicEventId(
  identifiers: ReturnType<typeof extractPayMeCallbackIdentifiers>,
  rawBody: Uint8Array
): string {
  const basis = [
    identifiers.notifyType,
    identifiers.subscriptionId ?? '',
    identifiers.subPaymeId ?? '',
    identifiers.paymeSaleId ?? '',
    createHash('sha256').update(rawBody).digest('hex').slice(0, 24),
  ].join(':')
  return `payme:${basis}`
}
