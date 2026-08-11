import { PaymentError } from '../../errors'
import type { BillingRepository } from '../../repository'
import type { PaymentPlan, PaymentProviderName } from '../../types'
import { isPayMeSubscriptionStatusMappingConfigured } from './payme-subscription-statuses'

export type VerifiedLifecycleContext = {
  provider: PaymentProviderName
  userId: string
  /** Local subscriptions.id (uuid row). */
  localSubscriptionId: string
  plan: PaymentPlan
  subPaymeId: string
  paymeSaleId?: string | null
  subPaymentDate?: string | null
  subNextDate?: string | null
  subStartDate?: string | null
  failureCode?: string | null
  failureMessage?: string | null
}

function assertStatusMappingReady(): void {
  if (!isPayMeSubscriptionStatusMappingConfigured()) {
    throw new PaymentError('provider_not_configured')
  }
}

function periodFromPayMe(ctx: VerifiedLifecycleContext) {
  // Period boundaries come from PayMe only — never compute +1 month/+1 year locally.
  return {
    periodStart: ctx.subStartDate ?? ctx.subPaymentDate ?? null,
    periodEnd: ctx.subNextDate ?? null,
    nextPaymentAt: ctx.subNextDate ?? null,
    lastPaymentAt: ctx.subPaymentDate ?? null,
  }
}

/**
 * Activates a subscription only after the caller completed full S2S verification
 * (get-subscriptions + get-transactions). Never call from an untrusted callback alone.
 */
export async function handleVerifiedFirstPayment(
  repository: BillingRepository,
  ctx: VerifiedLifecycleContext
) {
  assertStatusMappingReady()
  if (!ctx.paymeSaleId) throw new PaymentError('verification_failed')

  const periods = periodFromPayMe(ctx)
  await repository.updateSubscription(ctx.localSubscriptionId, {
    status: 'active',
    periodStart: periods.periodStart,
    periodEnd: periods.periodEnd,
    nextPaymentAt: periods.nextPaymentAt,
    lastPaymentAt: periods.lastPaymentAt,
    providerSubscriptionId: ctx.subPaymeId,
  })

  await repository.upsertTransaction({
    userId: ctx.userId,
    subscriptionId: ctx.localSubscriptionId,
    provider: ctx.provider,
    externalTransactionId: ctx.paymeSaleId,
    status: 'succeeded',
    amountAgorot: ctx.plan.amountAgorot,
    currency: ctx.plan.currency,
    paidAt: periods.lastPaymentAt,
    metadata: {},
  })
}

/**
 * Renews after a verified sub-iteration-success charge.
 * Idempotency must be enforced by the caller via alreadyProcessed / upsert key.
 */
export async function handleVerifiedRenewal(
  repository: BillingRepository,
  ctx: VerifiedLifecycleContext
) {
  assertStatusMappingReady()
  if (!ctx.paymeSaleId) throw new PaymentError('verification_failed')

  const periods = periodFromPayMe(ctx)
  await repository.updateSubscription(ctx.localSubscriptionId, {
    status: 'active',
    periodStart: periods.periodStart,
    periodEnd: periods.periodEnd,
    nextPaymentAt: periods.nextPaymentAt,
    lastPaymentAt: periods.lastPaymentAt,
  })

  await repository.upsertTransaction({
    userId: ctx.userId,
    subscriptionId: ctx.localSubscriptionId,
    provider: ctx.provider,
    externalTransactionId: ctx.paymeSaleId,
    status: 'succeeded',
    amountAgorot: ctx.plan.amountAgorot,
    currency: ctx.plan.currency,
    paidAt: periods.lastPaymentAt,
    metadata: {},
  })
}

export async function handleVerifiedCancel(
  repository: BillingRepository,
  ctx: VerifiedLifecycleContext
) {
  assertStatusMappingReady()
  await repository.updateSubscription(ctx.localSubscriptionId, {
    status: 'cancelled',
    cancelAtPeriodEnd: false,
    cancelledAt: new Date().toISOString(),
  })
}

export async function handleVerifiedPause(
  repository: BillingRepository,
  ctx: VerifiedLifecycleContext
) {
  assertStatusMappingReady()
  await repository.updateSubscription(ctx.localSubscriptionId, {
    status: 'paused',
  })
}

export async function handleVerifiedFailure(
  repository: BillingRepository,
  ctx: VerifiedLifecycleContext & { localStatus: 'payment_failed' | 'past_due' }
) {
  assertStatusMappingReady()
  await repository.updateSubscription(ctx.localSubscriptionId, {
    status: ctx.localStatus,
  })

  if (ctx.paymeSaleId) {
    await repository.upsertTransaction({
      userId: ctx.userId,
      subscriptionId: ctx.localSubscriptionId,
      provider: ctx.provider,
      externalTransactionId: ctx.paymeSaleId,
      status: 'failed',
      amountAgorot: ctx.plan.amountAgorot,
      currency: ctx.plan.currency,
      failureCode: ctx.failureCode ?? null,
      failureMessage: ctx.failureMessage ?? null,
      paidAt: null,
      metadata: {},
    })
  }
}

export async function handleVerifiedComplete(
  repository: BillingRepository,
  ctx: VerifiedLifecycleContext
) {
  assertStatusMappingReady()
  await repository.updateSubscription(ctx.localSubscriptionId, {
    status: 'expired',
  })
}
