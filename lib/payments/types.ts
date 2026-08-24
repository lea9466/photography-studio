export const PAYMENT_PROVIDER_NAMES = ['payme', 'sumit', 'grow', 'stripe', 'tranzila'] as const
export type PaymentProviderName = (typeof PAYMENT_PROVIDER_NAMES)[number]

export const SUBSCRIPTION_STATUSES = [
  'pending',
  'active',
  'past_due',
  'payment_failed',
  'cancelled',
  'expired',
  'paused',
] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const PAYMENT_STATUSES = [
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded',
  'disputed',
  'cancelled',
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export type BillingInterval = 'month' | 'year'

/**
 * recurring = standing provider authorization, bills automatically.
 * one_time = single charge, no standing authorization — for cards that
 * cannot hold one (e.g. immediate-debit "דיירקט" cards). The subscription
 * simply lapses at `current_period_end` with no further billing.
 */
export const PAYMENT_TYPES = ['recurring', 'one_time'] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

export type PaymentCustomer = {
  id: string
  provider: PaymentProviderName
  email: string | null
}

export type PaymentPlan = {
  id: string
  code: string
  name: string
  description: string | null
  amountAgorot: number
  currency: string
  billingInterval: BillingInterval
  providerPlanId: string | null
}

export type PaymentSubscription = {
  id: string
  provider: PaymentProviderName
  customerId: string | null
  planId: string | null
  status: SubscriptionStatus
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  nextPaymentAt: string | null
  metadata: Record<string, unknown>
}

export type PaymentTransaction = {
  id: string
  provider: PaymentProviderName
  subscriptionId: string | null
  status: PaymentStatus
  amountAgorot: number
  currency: string
  failureCode: string | null
  failureMessage: string | null
  paidAt: string | null
  metadata: Record<string, unknown>
}

export type CheckoutSession = {
  id: string
  provider: PaymentProviderName
  url: string | null
  token: string | null
  expiresAt: string | null
}

export const BUSINESS_WEBHOOK_EVENT_TYPES = [
  'subscription.created',
  'subscription.activated',
  'subscription.renewed',
  'subscription.payment_failed',
  'subscription.cancelled',
  'payment.succeeded',
  'payment.failed',
  'payment.refunded',
] as const

export type BusinessWebhookEventType =
  | (typeof BUSINESS_WEBHOOK_EVENT_TYPES)[number]
  | 'unknown'

export type WebhookEvent = {
  id: string
  provider: PaymentProviderName
  type: BusinessWebhookEventType
  occurredAt: string
  externalCustomerId: string | null
  externalSubscriptionId: string | null
  externalTransactionId: string | null
  rawPayload: Record<string, unknown>
  data: {
    userId?: string
    planCode?: string
    status?: SubscriptionStatus
    amountAgorot?: number
    currency?: string
    periodStart?: string | null
    periodEnd?: string | null
    nextPaymentAt?: string | null
    failureCode?: string | null
    failureMessage?: string | null
  }
}

export type CreateCustomerInput = {
  userId: string
  email: string
}

export type CreateCheckoutSessionInput = {
  userId: string
  customer: PaymentCustomer | null
  plan: PaymentPlan
  successUrl: string
  cancelUrl: string
  /** Local correlation id echoed by PayMe as subscription_id once field name is confirmed. */
  localSubscriptionId?: string
  smokeTest?: {
    priceAgorot: number
    iterations: number
    iterationType: number
  }
}

export type CreateSubscriptionInput = {
  customerId: string
  plan: PaymentPlan
  paymentToken?: string
}

export type CancelSubscriptionInput = {
  externalSubscriptionId: string
  atPeriodEnd: boolean
}

export type UpdatePaymentMethodInput = {
  externalCustomerId: string
  externalSubscriptionId: string | null
  returnUrl: string
  /** Active plan for the subscription being updated — PayMe requires the full
   *  subscription parameters (price/currency/iteration) even when only the
   *  payment method is being refreshed. */
  plan: PaymentPlan
}

export type ParseWebhookInput = {
  rawBody: Uint8Array
  headers: Headers
}
