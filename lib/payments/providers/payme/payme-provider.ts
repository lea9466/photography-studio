import { randomBytes } from 'node:crypto'
import { PaymentError } from '../../errors'
import type { PaymentProvider } from '../../provider'
import {
  isPaymentsCheckoutEnabled,
  isPaymentsSmokeTestUser,
} from '../../flags'
import type {
  CancelSubscriptionInput,
  CheckoutSession,
  CreateCheckoutSessionInput,
  CreateCustomerInput,
  CreateSubscriptionInput,
  ParseWebhookInput,
  PaymentCustomer,
  PaymentPlan,
  PaymentSubscription,
  UpdatePaymentMethodInput,
  WebhookEvent,
} from '../../types'
import {
  firstSubscriptionRecord,
  firstTransactionRecord,
  PayMeClient,
  readPayMeEnvironment,
} from './payme-client'
import {
  assertGenerateSubscriptionCorrelationReady,
  buildGenerateSubscriptionRequest,
} from './payme-generate'
import {
  mapPayMeCheckoutFromGenerate,
  mapPayMeCustomer,
  mapPayMeSubscriptionRecord,
  mapPayMeSubscriptionRecordVerified,
} from './payme-mapper'
import { parsePayMeWebhook } from './payme-webhook'
import type { PayMeGenerateSubscriptionResponse } from './payme-types'
import {
  verifySubscriptionAgainstPlan,
  verifySuccessfulTransaction,
} from './payme-verify'
export class PayMeProvider implements PaymentProvider {
  readonly name = 'payme' as const
  private clientInstance: PayMeClient | null = null

  constructor(client?: PayMeClient) {
    this.clientInstance = client ?? null
  }

  private client() {
    if (!this.clientInstance) this.clientInstance = new PayMeClient()
    return this.clientInstance
  }

  async createCustomer(input: CreateCustomerInput): Promise<PaymentCustomer> {
    // No separate PayMe create-customer for hosted subscription HPP.
    return mapPayMeCustomer(input)
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CheckoutSession> {
    const env = readPayMeEnvironment()
    const localSubscriptionId =
      input.localSubscriptionId ?? createLocalSubscriptionCorrelationId()

    const isSmokeTestProduction =
      env.env === 'production' &&
      !isPaymentsCheckoutEnabled() &&
      isPaymentsSmokeTestUser(input.userId) &&
      input.plan.code === 'studio_monthly'

    const body = buildGenerateSubscriptionRequest({
      paymeClientKey: env.clientKey,
      sellerPaymeId: env.sellerId,
      plan: input.plan,
      callbackUrl: webhookCallbackUrl(),
      returnUrl: input.successUrl,
      localSubscriptionId,
      subPrice: isSmokeTestProduction ? 500 : undefined,
      subIterations: isSmokeTestProduction ? 1 : undefined,
      test: env.env === 'sandbox',
    })

    assertGenerateSubscriptionCorrelationReady()
    const response = await this.client().postJson<PayMeGenerateSubscriptionResponse>(
      '/generate-subscription',
      body
    )

    return mapPayMeCheckoutFromGenerate(response)
  }

  async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<PaymentSubscription> {
    void input
    throw new PaymentError('provider_not_configured')
  }

  async getSubscription(
    externalSubscriptionId: string
  ): Promise<PaymentSubscription> {
    const response = await this.client().getSubscriptions({
      sub_payme_id: externalSubscriptionId,
    })
    const record = firstSubscriptionRecord(response)
    if (!record) throw new PaymentError('subscription_not_found')
    return mapPayMeSubscriptionRecord(record)
  }

  /**
   * Verifies a local pending subscription against PayMe via S2S lookup using the
   * local correlation id (subscription_id). Used on return from PayMe instead of
   * trusting an unverified webhook callback. Returns null when PayMe has no record.
   */
  async verifySubscriptionByCorrelation(
    localSubscriptionId: string
  ): Promise<PaymentSubscription | null> {
    const response = await this.client().getSubscriptions({
      subscription_id: localSubscriptionId,
    })
    const record = firstSubscriptionRecord(response)
    if (!record) return null
    return mapPayMeSubscriptionRecordVerified(record)
  }

  /**
   * S2S lookup + plan verification. Does not activate local state.
   */
  async verifySubscriptionWithPlan(input: {
    plan: PaymentPlan
    subPaymeId?: string
    subscriptionId?: string
    expectedAmountAgorot?: number
  }) {
    const env = this.client().credentials
    const response = await this.client().getSubscriptions({
      ...(input.subPaymeId ? { sub_payme_id: input.subPaymeId } : {}),
      ...(input.subscriptionId
        ? { subscription_id: input.subscriptionId }
        : {}),
    })
    const record = firstSubscriptionRecord(response)
    if (!record) throw new PaymentError('verification_failed')

    verifySubscriptionAgainstPlan(record, {
      plan: input.plan,
      sellerPaymeId: env.sellerId,
      expectedSubscriptionId: input.subscriptionId ?? null,
      expectedSubPaymeId: input.subPaymeId ?? null,
      expectedAmountAgorot: input.expectedAmountAgorot,
    })

    return record
  }

  /**
   * S2S transaction verification for happy-path success criteria.
   */
  async verifyTransactionWithPlan(input: {
    plan: PaymentPlan
    paymeSaleId?: string
    paymeTransactionId?: string
    alreadyProcessed?: boolean
    expectedAmountAgorot?: number
  }) {
    const env = this.client().credentials
    const response = await this.client().getTransactions({
      ...(input.paymeSaleId ? { payme_sale_id: input.paymeSaleId } : {}),
      ...(input.paymeTransactionId
        ? { payme_transaction_id: input.paymeTransactionId }
        : {}),
    })
    const record = firstTransactionRecord(response)
    if (!record) throw new PaymentError('verification_failed')

    verifySuccessfulTransaction(record, {
      plan: input.plan,
      sellerPaymeId: env.sellerId,
      alreadyProcessed: input.alreadyProcessed,
      expectedAmountAgorot: input.expectedAmountAgorot,
    })

    return record
  }

  async cancelSubscription(
    input: CancelSubscriptionInput
  ): Promise<PaymentSubscription> {
    const subPaymeId = input.externalSubscriptionId
    if (!subPaymeId) throw new PaymentError('subscription_not_found')

    const { httpStatus, body } = await this.client().cancelSubscription(subPaymeId)

    const statusErrorCode = body?.status_error_code
    const statusErrorDetails: string = body?.status_error_details ?? ''
    // PayMe returns HTTP 500 with status_error_code 305 ("סטטוס מכירה לא מתאים")
    // when the subscription is already cancelled or already scheduled for
    // cancellation. In both cases the cancellation is effectively complete from
    // the local state's perspective, so we treat it as success rather than an
    // error that would block the local record from being updated.
    const alreadyCancelled =
      statusErrorCode === 305 ||
      /מבוטל|בוטל|לא מתאים|already cancelled|not cancellable/i.test(statusErrorDetails)

    if (httpStatus < 200 || httpStatus >= 300) {
      if (alreadyCancelled) {
        console.warn('[payments] payme cancel: subscription already cancelled', {
          subPaymeId,
          httpStatus,
          statusErrorCode,
          statusErrorDetails,
        })
      } else {
        throw new PaymentError('provider_unavailable', {
          status: 422,
          cause: `PayMe cancel failed: http=${httpStatus} status_code=${body?.status_code} status_error_code=${statusErrorCode} details=${statusErrorDetails}`,
        })
      }
    } else if (statusErrorCode != null && statusErrorCode !== 0 && !alreadyCancelled) {
      throw new PaymentError('provider_unavailable', {
        status: 422,
        cause: `PayMe cancel returned an error: status_error_code=${statusErrorCode} details=${statusErrorDetails}`,
      })
    }

    const now = new Date().toISOString()
    const cancelAtPeriodEnd = input.atPeriodEnd
    return {
      id: subPaymeId,
      provider: 'payme',
      customerId: null,
      planId: null,
      status: cancelAtPeriodEnd ? 'active' : 'cancelled',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd,
      cancelledAt: cancelAtPeriodEnd ? null : now,
      nextPaymentAt: null,
      metadata: {
        sub_payme_id: subPaymeId,
        cancelled_via: 'payme-cancel-subscription',
      },
    }
  }

  async updatePaymentMethod(
    input: UpdatePaymentMethodInput
  ): Promise<CheckoutSession> {
    const subPaymeId = input.externalSubscriptionId
    if (!subPaymeId) throw new PaymentError('subscription_not_found')

    const response = await this.client().updateSubscriptionPayment({
      subPaymeId,
      callbackUrl: webhookCallbackUrl(),
      returnUrl: input.returnUrl,
    })

    if (!response.sub_url) {
      console.error('[payments] payme update-payment returned no sub_url', {
        subPaymeId,
        statusCode: response.status_code,
        paymeStatus: response.payme_status,
        statusErrorCode: response.status_error_code,
      })
      throw new PaymentError('provider_unavailable', {
        detail: `PayMe update-payment returned no sub_url: status_code=${response.status_code} status_error_code=${response.status_error_code} payme_status=${response.payme_status}`,
      })
    }

    return mapPayMeCheckoutFromGenerate(response)
  }

  async parseWebhook(input: ParseWebhookInput): Promise<WebhookEvent> {
    return parsePayMeWebhook(input)
  }
}

function createLocalSubscriptionCorrelationId() {
  return `sub_${randomBytes(16).toString('hex')}`
}

function webhookCallbackUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (!appUrl) throw new PaymentError('provider_not_configured')
  return `${appUrl}/api/payments/webhooks/payme`
}
