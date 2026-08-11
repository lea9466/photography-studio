import { PaymentError } from '../../errors'
import type { BillingRepository } from '../../repository'
import type { PaymentPlan, PaymentProviderName, SubscriptionStatus } from '../../types'
import type { PayMeCallbackIdentifiers } from './payme-types'
import type {
  PayMeSubscriptionRecord,
  PayMeTransactionRecord,
} from './payme-types'
import {
  localStatusFromVerifiedSubscription,
  verifyActiveSubscriptionS2S,
  verifySubscriptionAgainstPlan,
  verifySuccessfulTransaction,
} from './payme-verify'
import { mapPaymeSubscriptionStatus } from './payme-subscription-statuses'
import {
  handleVerifiedCancel,
  handleVerifiedComplete,
  handleVerifiedFailure,
  handleVerifiedFirstPayment,
  handleVerifiedPause,
  handleVerifiedRenewal,
  type VerifiedLifecycleContext,
} from './payme-handlers'

export type PipelineParseResult = {
  identifiers: PayMeCallbackIdentifiers
  eventId: string
}

export type CorrelatedSubscription = {
  localRowId: string
  userId: string
  plan: PaymentPlan
  localSubscriptionId: string | null
  providerSubscriptionId: string | null
  currentStatus: SubscriptionStatus | null
}

/**
 * Step: correlate callback identifiers to a local subscription row.
 * Pure lookup helper — unit-testable with a fake repository.
 */
export async function correlateLocalSubscription(
  repository: BillingRepository,
  provider: PaymentProviderName,
  identifiers: PayMeCallbackIdentifiers
): Promise<CorrelatedSubscription | null> {
  if (identifiers.subPaymeId) {
    const byProvider = await repository.getSubscriptionByExternalId(
      provider,
      identifiers.subPaymeId
    )
    if (byProvider) {
      const plan = await repository.getPlanById(byProvider.plan_id)
      if (!plan) return null
      return {
        localRowId: byProvider.id,
        userId: byProvider.user_id,
        plan: {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          amountAgorot: plan.amount_agorot,
          currency: plan.currency,
          billingInterval: plan.billing_interval,
          providerPlanId: plan.provider_plan_id,
        },
        localSubscriptionId:
          typeof byProvider.provider_metadata === 'object' &&
          byProvider.provider_metadata &&
          'local_subscription_id' in byProvider.provider_metadata
            ? String(
                (byProvider.provider_metadata as { local_subscription_id?: unknown })
                  .local_subscription_id ?? ''
              ) || null
            : byProvider.provider_subscription_id,
        providerSubscriptionId: byProvider.provider_subscription_id,
        currentStatus: byProvider.status,
      }
    }
  }

  if (identifiers.subscriptionId) {
    const byLocal = await repository.getSubscriptionByExternalId(
      provider,
      identifiers.subscriptionId
    )
    if (byLocal) {
      const plan = await repository.getPlanById(byLocal.plan_id)
      if (!plan) return null
      return {
        localRowId: byLocal.id,
        userId: byLocal.user_id,
        plan: {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          amountAgorot: plan.amount_agorot,
          currency: plan.currency,
          billingInterval: plan.billing_interval,
          providerPlanId: plan.provider_plan_id,
        },
        localSubscriptionId: identifiers.subscriptionId,
        providerSubscriptionId: byLocal.provider_subscription_id,
        currentStatus: byLocal.status,
      }
    }
  }

  return null
}

export type PayMeVerificationProvider = {
  verifySubscriptionWithPlan(input: {
    plan: PaymentPlan
    subPaymeId?: string
    subscriptionId?: string
  }): Promise<PayMeSubscriptionRecord>
  verifyTransactionWithPlan(input: {
    plan: PaymentPlan
    paymeSaleId?: string
    paymeTransactionId?: string
    alreadyProcessed?: boolean
  }): Promise<PayMeTransactionRecord>
}

export async function processPayMeCallbackLifecycle(input: {
  repository: BillingRepository
  provider: PaymentProviderName
  identifiers: PayMeCallbackIdentifiers
  providerClient: PayMeVerificationProvider
}): Promise<'processed' | 'ignored'> {
  const correlated = await correlateLocalSubscription(
    input.repository,
    input.provider,
    input.identifiers
  )

  if (!correlated) return 'ignored'

  const notifyType = input.identifiers.notifyType
  const plan = correlated.plan
  const expectedSubscriptionId = correlated.localSubscriptionId ?? null
  const expectedSubPaymeId = input.identifiers.subPaymeId ?? null

  const subscriptionRecord = await input.providerClient.verifySubscriptionWithPlan({
    plan,
    subPaymeId: expectedSubPaymeId ?? undefined,
    subscriptionId: expectedSubscriptionId ?? undefined,
  })

  const isMonetary = notifyType === 'sub-iteration-success' || notifyType === 'sub-active' || notifyType === 'sub-failure'
  const isActiveLifecycle = notifyType === 'sub-active' || notifyType === 'sub-iteration-success'

  if (isMonetary) {
    const existing = input.identifiers.paymeSaleId
      ? await input.repository.getTransactionByExternalId('payme', input.identifiers.paymeSaleId)
      : null

    await input.providerClient.verifyTransactionWithPlan({
      plan,
      paymeSaleId: input.identifiers.paymeSaleId ?? undefined,
      alreadyProcessed: Boolean(existing),
    })
  }

  const verifiedSubscription = isActiveLifecycle
    ? pipelineVerifyActiveSubscription(subscriptionRecord, {
        plan,
        sellerPaymeId: subscriptionRecord.seller_payme_id ?? '',
        expectedSubscriptionId,
        expectedSubPaymeId,
      })
    : pipelineVerifySubscription(subscriptionRecord, {
        plan,
        sellerPaymeId: subscriptionRecord.seller_payme_id ?? '',
        expectedSubscriptionId,
        expectedSubPaymeId,
      })

  const subscriptionForStatus =
    typeof verifiedSubscription === 'object' &&
    verifiedSubscription !== null &&
    'record' in verifiedSubscription
      ? verifiedSubscription.record
      : verifiedSubscription

  const localStatus = localStatusFromVerifiedSubscription(subscriptionForStatus)
  const failureLocalStatus = localStatus === 'payment_failed' || localStatus === 'past_due'
    ? localStatus
    : 'payment_failed'

  await dispatchVerifiedLifecycle({
    repository: input.repository,
    notifyType,
    ctx: {
      provider: input.provider,
      userId: correlated.userId,
      localSubscriptionId: correlated.localRowId,
      plan,
      subPaymeId: input.identifiers.subPaymeId ?? '',
      paymeSaleId: input.identifiers.paymeSaleId ?? null,
      subPaymentDate: subscriptionRecord.sub_payment_date ?? null,
      subNextDate: subscriptionRecord.sub_next_date ?? null,
      subStartDate: subscriptionRecord.sub_start_date ?? null,
    },
    isFirstPayment: correlated.currentStatus === null || correlated.currentStatus === 'pending',
    failureLocalStatus,
  })

  return 'processed'
}

/** Step: verify get-subscriptions record against local plan. */
export function pipelineVerifySubscription(
  record: PayMeSubscriptionRecord,
  input: {
    plan: PaymentPlan
    sellerPaymeId: string
    expectedSubscriptionId?: string | null
    expectedSubPaymeId?: string | null
  }
) {
  verifySubscriptionAgainstPlan(record, input)
  return record
}

/**
 * Step: require active subscription after full S2S plan checks.
 * `sub_status=2` alone is rejected without plan/seller/paid verification.
 */
export function pipelineVerifyActiveSubscription(
  record: PayMeSubscriptionRecord,
  input: {
    plan: PaymentPlan
    sellerPaymeId: string
    expectedSubscriptionId?: string | null
    expectedSubPaymeId?: string | null
  }
) {
  verifyActiveSubscriptionS2S(record, input)
  return {
    record,
    localStatus: localStatusFromVerifiedSubscription(record),
  }
}

/** Step: verify get-transactions happy-path + idempotency. */
export function pipelineVerifyTransaction(
  record: PayMeTransactionRecord,
  input: {
    plan: PaymentPlan
    sellerPaymeId: string
    alreadyProcessed?: boolean
  }
) {
  verifySuccessfulTransaction(record, input)
  return record
}

/** Step: map sub_status — fail-closed until PATCH POINT A. */
export function pipelineMapSubStatus(subStatus: unknown) {
  return mapPaymeSubscriptionStatus(subStatus)
}

export type MonetaryNotifyType =
  | 'sub-iteration-success'
  | 'sub-active'
  | 'sub-failure'

export function isMonetaryNotifyType(
  notifyType: string
): notifyType is MonetaryNotifyType {
  return (
    notifyType === 'sub-iteration-success' ||
    notifyType === 'sub-active' ||
    notifyType === 'sub-failure'
  )
}

/**
 * Final dispatch after S2S verification. Requires status mapping (A).
 * Callers must already have verified subscription (+ transaction when monetary).
 */
export async function dispatchVerifiedLifecycle(input: {
  repository: BillingRepository
  notifyType: string
  ctx: VerifiedLifecycleContext
  isFirstPayment: boolean
  failureLocalStatus?: 'payment_failed' | 'past_due'
}) {
  const { repository, notifyType, ctx } = input

  if (notifyType === 'sub-iteration-success' || notifyType === 'sub-active') {
    if (input.isFirstPayment) {
      await handleVerifiedFirstPayment(repository, ctx)
      return 'first_payment'
    }
    await handleVerifiedRenewal(repository, ctx)
    return 'renewal'
  }

  if (notifyType === 'sub-cancel') {
    await handleVerifiedCancel(repository, ctx)
    return 'cancel'
  }

  if (notifyType === 'sub-pause') {
    await handleVerifiedPause(repository, ctx)
    return 'pause'
  }

  if (notifyType === 'sub-failure') {
    await handleVerifiedFailure(repository, {
      ...ctx,
      localStatus: input.failureLocalStatus ?? 'payment_failed',
    })
    return 'failure'
  }

  if (notifyType === 'sub-complete') {
    await handleVerifiedComplete(repository, ctx)
    return 'complete'
  }

  throw new PaymentError('provider_not_configured')
}

/**
 * Documents the intended end-to-end order. Not invoked from the webhook yet
 * while blockers A/B/C remain open — each step is unit-tested separately.
 */
export const PAYME_VERIFICATION_PIPELINE_STEPS = [
  'parse_callback',
  'correlate_local_subscription',
  'get_subscriptions',
  'verify_seller_price_currency_iteration',
  'get_transactions_if_monetary',
  'verify_completed_20000_idempotency',
  'map_sub_status',
  'update_local_state',
] as const
