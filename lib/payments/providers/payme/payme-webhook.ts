import { PaymentError } from '../../errors'
import type { ParseWebhookInput, WebhookEvent } from '../../types'

export async function parsePayMeWebhook(
  _input: ParseWebhookInput
): Promise<WebhookEvent> {
  // TODO(PayMe): Verify the official signature header/algorithm against the
  // raw bytes with constant-time comparison, then parse and map the payload.
  // Failing closed is intentional: an unsigned event must never alter billing.
  throw new PaymentError('provider_not_configured')
}
