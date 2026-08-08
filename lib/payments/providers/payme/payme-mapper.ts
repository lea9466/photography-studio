import { PaymentError } from '../../errors'
import type {
  CheckoutSession,
  PaymentCustomer,
  PaymentSubscription,
  WebhookEvent,
} from '../../types'
import type { PayMeApiPayload, PayMeWebhookPayload } from './payme-types'

function officialContractRequired(): never {
  throw new PaymentError('provider_not_configured')
}

export function mapPayMeCustomer(_payload: PayMeApiPayload): PaymentCustomer {
  // TODO(PayMe): Map only after verifying the official create-customer response.
  return officialContractRequired()
}

export function mapPayMeCheckout(_payload: PayMeApiPayload): CheckoutSession {
  // TODO(PayMe): Map only after verifying Hosted Payment Page/tokenization fields.
  return officialContractRequired()
}

export function mapPayMeSubscription(_payload: PayMeApiPayload): PaymentSubscription {
  // TODO(PayMe): Map only after verifying recurring-payment response fields.
  return officialContractRequired()
}

export function mapPayMeWebhook(_payload: PayMeWebhookPayload): WebhookEvent {
  // TODO(PayMe): Map official event names and correlation fields here only.
  return officialContractRequired()
}
