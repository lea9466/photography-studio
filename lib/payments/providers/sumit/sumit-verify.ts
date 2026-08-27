import { PaymentError } from '../../errors'
import type { SumitClient } from './sumit-client'
import type { SumitGetPaymentResponse } from './sumit-types'

export type VerifiedSumitPayment = {
  paymentId: number
  customerId: number
  amount: number
  token: string
  expirationMonth: number
  expirationYear: number
}

/**
 * S2S verification of a payment returned via a browser redirect — never trust
 * the `OG-*` query params on their own (same posture as `payme-verify.ts` /
 * `verifySubscriptionByCorrelation`'s doc comments elsewhere in this codebase).
 * Everything needed (CustomerID, ValidPayment, Amount, token+expiration) comes
 * back from this single call, keyed only by `OG-PaymentID` — confirmed by a
 * live test call (2026-08-13).
 */
export async function verifySumitPayment(
  client: SumitClient,
  paymentId: number,
  /**
   * The reusable card token + expiry are only needed by callers that go on to
   * charge again (recurring). A one-time `beginredirect` charge is already
   * final, so it verifies with `requireToken: false` — otherwise a completed
   * charge whose `/billing/payments/get/` happens not to echo the token would
   * throw here and leave the customer charged-but-not-activated.
   */
  requireToken = true
): Promise<VerifiedSumitPayment> {
  const response = await client.postJson<SumitGetPaymentResponse>('/billing/payments/get/', {
    PaymentID: paymentId,
  })

  const payment = response.Data?.Payment
  const token = payment?.PaymentMethod?.CreditCard_Token
  const expirationMonth = payment?.PaymentMethod?.CreditCard_ExpirationMonth
  const expirationYear = payment?.PaymentMethod?.CreditCard_ExpirationYear

  const tokenOk = !requireToken || (Boolean(token) && Boolean(expirationMonth) && Boolean(expirationYear))
  if (
    (response.Status ?? 1) !== 0 ||
    !payment?.ValidPayment ||
    !payment.CustomerID ||
    !tokenOk
  ) {
    throw new PaymentError('verification_failed', {
      detail: `SUMIT payment verification failed: status=${response.Status} description=${payment?.StatusDescription ?? response.UserErrorMessage ?? ''}`,
    })
  }

  return {
    paymentId,
    customerId: payment.CustomerID,
    amount: payment.Amount ?? 0,
    token: token ?? '',
    expirationMonth: expirationMonth ?? 0,
    expirationYear: expirationYear ?? 0,
  }
}

/** Rejects a verified payment made under a different SUMIT customer than expected. */
export function assertSumitCustomerMatches(
  verified: VerifiedSumitPayment,
  expectedCustomerId: number
): void {
  if (verified.customerId !== expectedCustomerId) {
    throw new PaymentError('verification_failed', {
      detail: `SUMIT payment customer mismatch: got ${verified.customerId}, expected ${expectedCustomerId}`,
    })
  }
}
