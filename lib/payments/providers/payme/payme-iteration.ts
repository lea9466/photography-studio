import { PaymentError } from '../../errors'
import type { BillingInterval, PaymentPlan } from '../../types'
import {
  PAYME_ITERATION_TYPE_MONTHLY,
  PAYME_ITERATION_TYPE_YEARLY,
  type PayMeIterationType,
} from './payme-types'

export function payMeIterationTypeForInterval(
  interval: BillingInterval
): PayMeIterationType {
  if (interval === 'month') return PAYME_ITERATION_TYPE_MONTHLY
  if (interval === 'year') return PAYME_ITERATION_TYPE_YEARLY
  throw new PaymentError('invalid_request')
}

export function payMeIterationTypeForPlan(plan: PaymentPlan): PayMeIterationType {
  return payMeIterationTypeForInterval(plan.billingInterval)
}

export function assertPayMeIterationType(
  value: unknown,
  expected: PayMeIterationType
): asserts value is PayMeIterationType {
  const numeric = typeof value === 'string' ? Number(value) : value
  if (numeric !== expected) {
    throw new PaymentError('verification_failed')
  }
}
