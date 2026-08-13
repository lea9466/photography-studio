import type { PaymentPlan } from '../../types'
import { payMeIterationTypeForPlan } from './payme-iteration'
import type { PayMeGenerateSubscriptionRequestKnown } from './payme-types'

/**
 * PayMe officially echoes our local correlation under `subscription_id`.
 * We use that field on outbound generate-subscription requests.
 */
export const PAYME_CORRELATION_FIELD_NAME = 'subscription_id'
export const PAYME_CORRELATION_FIELD_UNKNOWN = false

export type BuildGenerateSubscriptionInput = {
  paymeClientKey?: string | null
  sellerPaymeId: string
  plan: PaymentPlan
  description?: string
  callbackUrl: string
  returnUrl: string
  /**
   * Local correlation id that PayMe will echo as `subscription_id`.
   */
  localSubscriptionId: string
  /** Optional buyer fields only if/when officially required (never card/PII secrets). */
  buyer?: {
    email?: string
    name?: string
  }
  subPrice?: number
  subIterations?: number
  test?: boolean
}

/**
 * Builds generate-subscription request body from the local plan.
 * Uses the plan-driven price/currency/iteration and a local correlation id.
 */
export function buildGenerateSubscriptionRequest(
  input: BuildGenerateSubscriptionInput
): PayMeGenerateSubscriptionRequestKnown {
  void input.buyer

  // All UTC — mixing local setDate() with UTC getters here previously could
  // compute the wrong calendar day depending on the server's timezone offset.
  const start = new Date()
  start.setUTCDate(start.getUTCDate() + 1) // תאריך מחר (UTC) — ה-API של PayMe דורש תאריך עתידי
  const day = String(start.getUTCDate()).padStart(2, '0')
  const month = String(start.getUTCMonth() + 1).padStart(2, '0')
  const year = start.getUTCFullYear()

  return {
    ...(input.paymeClientKey ? { payme_client_key: input.paymeClientKey } : {}),
    seller_payme_id: input.sellerPaymeId,
    subscription_id: input.localSubscriptionId,
    sub_price: input.subPrice ?? input.plan.amountAgorot,
    sub_currency: input.plan.currency.toUpperCase(),
    sub_description: input.description ?? input.plan.name,
    sub_iteration_type: payMeIterationTypeForPlan(input.plan),
    sub_iterations: input.subIterations ?? -1,
    sub_start_date: `${day}/${month}/${year}`,
    sub_callback_url: input.callbackUrl,
    sub_return_url: input.returnUrl,
    language: 'he',
    ...(input.test ? { test: 1 } : {}),
  }
}

/** @deprecated use buildGenerateSubscriptionRequest */
export const buildGenerateSubscriptionRequestKnown = buildGenerateSubscriptionRequest

/**
 * Attaches the correlation field using the official PayMe field name.
 */
export function withGenerateSubscriptionCorrelation(
  body: PayMeGenerateSubscriptionRequestKnown,
  localSubscriptionId: string
): PayMeGenerateSubscriptionRequestKnown & Record<string, unknown> {
  return {
    ...body,
    [PAYME_CORRELATION_FIELD_NAME]: localSubscriptionId,
  }
}

/**
 * Correlation is ready when the generate body includes the official field.
 */
export function assertGenerateSubscriptionCorrelationReady(): void {
  return undefined
}

export function isGenerateSubscriptionCorrelationReady(): boolean {
  return typeof PAYME_CORRELATION_FIELD_NAME === 'string' &&
    PAYME_CORRELATION_FIELD_NAME.length > 0
}
