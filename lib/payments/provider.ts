import type {
  CancelSubscriptionInput,
  CheckoutSession,
  CreateCheckoutSessionInput,
  CreateCustomerInput,
  CreateSubscriptionInput,
  ParseWebhookInput,
  PaymentCustomer,
  PaymentProviderName,
  PaymentSubscription,
  UpdatePaymentMethodInput,
  WebhookEvent,
} from './types'

export interface PaymentProvider {
  readonly name: PaymentProviderName

  createCustomer(input: CreateCustomerInput): Promise<PaymentCustomer>
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession>
  /**
   * Single charge, no standing authorization — for cards that cannot hold one
   * (e.g. immediate-debit "דיירקט" cards). Providers without a distinct
   * one-time flow should throw `provider_not_configured`, same as
   * `createSubscription` before its own integration is ready.
   */
  createOneTimeCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession>
  createSubscription(input: CreateSubscriptionInput): Promise<PaymentSubscription>
  getSubscription(externalSubscriptionId: string): Promise<PaymentSubscription>
  cancelSubscription(input: CancelSubscriptionInput): Promise<PaymentSubscription>
  updatePaymentMethod(input: UpdatePaymentMethodInput): Promise<CheckoutSession>
  verifySubscriptionByCorrelation(
    localSubscriptionId: string
  ): Promise<PaymentSubscription | null>
  parseWebhook(input: ParseWebhookInput): Promise<WebhookEvent>
}
