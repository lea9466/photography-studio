import { PaymentError } from '../../errors'
import type { PaymentProvider } from '../../provider'
import type {
  CancelSubscriptionInput,
  CheckoutSession,
  CreateCheckoutSessionInput,
  CreateCustomerInput,
  CreateSubscriptionInput,
  ParseWebhookInput,
  PaymentCustomer,
  PaymentSubscription,
  UpdatePaymentMethodInput,
  WebhookEvent,
} from '../../types'
import { parsePayMeWebhook } from './payme-webhook'

function pendingOfficialContract(_operation: string): never {
  throw new PaymentError('provider_not_configured')
}

export class PayMeProvider implements PaymentProvider {
  readonly name = 'payme' as const

  async createCustomer(_input: CreateCustomerInput): Promise<PaymentCustomer> {
    return pendingOfficialContract('createCustomer')
  }

  async createCheckoutSession(
    _input: CreateCheckoutSessionInput
  ): Promise<CheckoutSession> {
    return pendingOfficialContract('createCheckoutSession')
  }

  async createSubscription(
    _input: CreateSubscriptionInput
  ): Promise<PaymentSubscription> {
    return pendingOfficialContract('createSubscription')
  }

  async getSubscription(
    _externalSubscriptionId: string
  ): Promise<PaymentSubscription> {
    return pendingOfficialContract('getSubscription')
  }

  async cancelSubscription(
    _input: CancelSubscriptionInput
  ): Promise<PaymentSubscription> {
    return pendingOfficialContract('cancelSubscription')
  }

  async updatePaymentMethod(
    _input: UpdatePaymentMethodInput
  ): Promise<CheckoutSession> {
    return pendingOfficialContract('updatePaymentMethod')
  }

  async parseWebhook(input: ParseWebhookInput): Promise<WebhookEvent> {
    return parsePayMeWebhook(input)
  }
}
