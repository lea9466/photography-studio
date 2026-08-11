import { PaymentError } from '../../errors'
import type { PaymentPlan } from '../../types'
import { payMeIterationTypeForPlan } from './payme-iteration'
import {
  isPaymeSubscriptionActive,
  mapPaymeSubscriptionStatus,
} from './payme-subscription-statuses'
import type {
  PayMeSubscriptionRecord,
  PayMeTransactionRecord,
} from './payme-types'

export type PlanVerificationContext = {
  plan: PaymentPlan
  sellerPaymeId: string
  /** Local correlation id we stored when creating the subscription. */
  expectedSubscriptionId?: string | null
  /** PayMe subscription id already bound locally, if any. */
  expectedSubPaymeId?: string | null
}

export type TransactionVerificationContext = {
  plan: PaymentPlan
  sellerPaymeId: string
  /** When true, the transaction id was already processed locally. */
  alreadyProcessed?: boolean
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function normalizeCurrency(value: unknown): string | null {
  const raw = asString(value)
  return raw ? raw.toUpperCase() : null
}

/**
 * Verifies a get-subscriptions record against the local plan.
 * Does not activate local state by itself.
 */
export function verifySubscriptionAgainstPlan(
  record: PayMeSubscriptionRecord,
  context: PlanVerificationContext
): void {
  const seller = asString(record.seller_payme_id)
  if (!seller || seller !== context.sellerPaymeId) {
    throw new PaymentError('verification_failed')
  }

  if (context.expectedSubscriptionId) {
    const subscriptionId = asString(record.subscription_id)
    if (!subscriptionId || subscriptionId !== context.expectedSubscriptionId) {
      throw new PaymentError('verification_failed')
    }
  }

  if (context.expectedSubPaymeId) {
    const subPaymeId = asString(record.sub_payme_id)
    if (!subPaymeId || subPaymeId !== context.expectedSubPaymeId) {
      throw new PaymentError('verification_failed')
    }
  }

  const price = asNumber(record.sub_price)
  if (price === null || price !== context.plan.amountAgorot) {
    throw new PaymentError('verification_failed')
  }

  const currency = normalizeCurrency(record.sub_currency)
  if (!currency || currency !== context.plan.currency.toUpperCase()) {
    throw new PaymentError('verification_failed')
  }

  const expectedIteration = payMeIterationTypeForPlan(context.plan)
  const iteration = asNumber(record.sub_iteration_type)
  if (iteration === null || iteration !== expectedIteration) {
    throw new PaymentError('verification_failed')
  }
}

/**
 * Full S2S gate before treating a subscription as locally active.
 * `sub_status=2` alone is never enough.
 */
export function verifyActiveSubscriptionS2S(
  record: PayMeSubscriptionRecord,
  context: PlanVerificationContext
): void {
  verifySubscriptionAgainstPlan(record, context)

  if (!isPaymeSubscriptionActive(record.sub_status)) {
    throw new PaymentError('verification_failed')
  }

  if (record.sub_paid !== true) {
    throw new PaymentError('verification_failed')
  }
}

/**
 * Happy-path transaction verification from official success criteria:
 * status_code=0, sale_status=completed, transaction_error_code=20000,
 * matching seller/amount/currency, not already processed.
 *
 * `transaction_status` is complementary metadata and is not used as proof.
 */
export function verifySuccessfulTransaction(
  record: PayMeTransactionRecord,
  context: TransactionVerificationContext
): void {
  if (context.alreadyProcessed) {
    throw new PaymentError('verification_failed')
  }

  const seller = asString(record.seller_payme_id)
  if (!seller || seller !== context.sellerPaymeId) {
    throw new PaymentError('verification_failed')
  }

  const statusCode = asNumber(record.status_code)
  if (statusCode !== 0) {
    throw new PaymentError('verification_failed')
  }

  const saleStatus = asString(record.sale_status)?.toLowerCase()
  if (saleStatus !== 'completed') {
    throw new PaymentError('verification_failed')
  }

  const errorCode = asNumber(record.transaction_error_code)
  if (errorCode !== 20000) {
    throw new PaymentError('verification_failed')
  }

  const amount =
    asNumber(record.transaction_price) ?? asNumber(record.sale_price)
  if (amount === null || amount !== context.plan.amountAgorot) {
    throw new PaymentError('verification_failed')
  }

  const currency =
    normalizeCurrency(record.sale_currency) ?? normalizeCurrency(record.currency)
  if (!currency || currency !== context.plan.currency.toUpperCase()) {
    throw new PaymentError('verification_failed')
  }
}

export function isSuccessfulPaidSubscription(
  record: PayMeSubscriptionRecord
): boolean {
  return record.sub_paid === true && isPaymeSubscriptionActive(record.sub_status)
}

export function localStatusFromVerifiedSubscription(
  record: PayMeSubscriptionRecord
) {
  return mapPaymeSubscriptionStatus(record.sub_status)
}

export {
  mapPayMeSubStatusToLocal,
  mapPaymeSubscriptionStatus,
} from './payme-subscription-statuses'
