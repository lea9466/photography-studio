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
    _input: CancelSubscriptionInput
  ): Promise<PaymentSubscription> {
    // Cancel local mapping depends on confirmed sub_status after S2S.
    throw new PaymentError('provider_not_configured')
  }

  async updatePaymentMethod(
    _input: UpdatePaymentMethodInput
  ): Promise<CheckoutSession> {
    throw new PaymentError('provider_not_configured')
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
