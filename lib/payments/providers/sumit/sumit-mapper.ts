import { PaymentError } from '../../errors'
import type { CheckoutSession, PaymentCustomer, PaymentSubscription } from '../../types'
import type {
  SumitCreateCustomerResponse,
  SumitBeginRedirectResponse,
  SumitChargeRecurringResponse,
  SumitRecurringItem,
  SumitRecurringStatus,
} from './sumit-types'

/**
 * SUMIT amounts are decimal ILS (e.g. 100.00), while the rest of this codebase
 * (and PayMe) work in integer agorot. Every amount crossing the SUMIT boundary
 * must go through these two conversions — getting this wrong is a 100x
 * over/undercharge, not a rounding error.
 */
export function agorotToSumitAmount(agorot: number): number {
  return Math.round(agorot) / 100
}

export function sumitAmountToAgorot(amount: number): number {
  return Math.round(amount * 100)
}

export function mapSumitCustomer(input: {
  customerId: number
  email: string
}): PaymentCustomer {
  return {
    id: String(input.customerId),
    provider: 'sumit',
    email: input.email,
  }
}

/**
 * `CancelSubscriptionInput`/`getSubscription` in the generic `PaymentProvider`
 * interface only carry a single opaque `externalSubscriptionId` string — but
 * every SUMIT recurring-item call (cancel, and the only way to look one up)
 * requires BOTH `Customer.ID` and the recurring item id together (confirmed by
 * a live test call: /billing/recurring/cancel/ rejects a request missing
 * Customer). Since this id is opaque to the rest of the codebase (just stored
 * as text and echoed back verbatim), we encode both pieces into the id we
 * return from the first charge — this stays entirely inside providers/sumit.
 */
export function buildSumitSubscriptionId(customerId: number, recurringItemId: number): string {
  return `${customerId}:${recurringItemId}`
}

export function parseSumitSubscriptionId(
  value: string
): { customerId: number; recurringItemId: number } | null {
  const [customerIdRaw, recurringItemIdRaw] = value.split(':')
  const customerId = Number(customerIdRaw)
  const recurringItemId = Number(recurringItemIdRaw)
  if (!Number.isFinite(customerId) || !Number.isFinite(recurringItemId)) return null
  return { customerId, recurringItemId }
}

export function assertSumitCustomerCreated(
  response: SumitCreateCustomerResponse
): number {
  if ((response.Status ?? 1) !== 0 || !response.Data?.CustomerID) {
    throw new PaymentError('provider_unavailable', {
      detail: `SUMIT customer create failed: status=${response.Status} message=${response.UserErrorMessage ?? ''}`,
    })
  }
  return response.Data.CustomerID
}

export function mapSumitCheckoutFromRedirect(
  response: SumitBeginRedirectResponse
): CheckoutSession {
  const url = response.Data?.RedirectURL
  if (!url) {
    throw new PaymentError('provider_unavailable', {
      detail: `SUMIT beginredirect returned no RedirectURL: status=${response.Status} message=${response.UserErrorMessage ?? ''}`,
    })
  }
  return {
    id: 'sumit-checkout',
    provider: 'sumit',
    url,
    token: null,
    expiresAt: null,
  }
}

/**
 * Maps the response of the FIRST /billing/recurring/charge/ call, which both
 * charges the customer and establishes the recurring authorization.
 */
export function mapSumitFirstRecurringCharge(
  response: SumitChargeRecurringResponse
): PaymentSubscription {
  const payment = response.Data?.Payment
  const recurringItemId =
    response.Data?.RecurringCustomerItemIDs?.[0] ?? payment?.RecurringCustomerItemIDs?.[0]
  const customerId = response.Data?.CustomerID
  if ((response.Status ?? 1) !== 0 || !payment?.ValidPayment || !recurringItemId || !customerId) {
    // `payment.StatusDescription` is SUMIT's own customer-facing Hebrew reason,
    // e.g. "החברה שהנפיקה … לא אישרה את החיוב … (קוד 004)" — surface it as-is.
    throw new PaymentError('verification_failed', {
      detail:
        payment?.StatusDescription?.trim() ||
        response.UserErrorMessage?.trim() ||
        'החיוב לא אושר. בדקי את פרטי הכרטיס או נסי כרטיס אחר.',
    })
  }

  return {
    id: buildSumitSubscriptionId(customerId, recurringItemId),
    provider: 'sumit',
    customerId: String(customerId),
    planId: null,
    status: 'active',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    nextPaymentAt: null,
    metadata: {
      recurring_item_id: recurringItemId,
      payment_id: payment.ID ?? null,
      auth_number: payment.AuthNumber ?? null,
    },
  }
}

/**
 * Maps a verified one-time (non-recurring) payment into a `PaymentSubscription`.
 * Unlike `mapSumitFirstRecurringCharge`, no `RecurringCustomerItemIDs` exists —
 * this charge never asked SUMIT/the card issuer for a standing authorization
 * (see `createOneTimeCheckoutSession` in sumit-provider.ts), which is exactly
 * why it works for cards (e.g. immediate-debit "דיירקט") that reject that
 * request. `id` encodes the bare payment id — there is no recurring item to
 * look up or cancel later, so `parseSumitSubscriptionId` is never applied to it.
 */
export function mapSumitOneTimeCharge(input: {
  paymentId: number
  customerId: number
  amount: number
}): PaymentSubscription {
  return {
    id: `onetime_${input.paymentId}`,
    provider: 'sumit',
    customerId: String(input.customerId),
    planId: null,
    status: 'active',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    nextPaymentAt: null,
    metadata: {
      payment_id: input.paymentId,
      amount: input.amount,
      payment_type: 'one_time',
    },
  }
}

/**
 * 0=Active is confirmed (default state of a freshly-created recurring item).
 * 1/2/3 come from the third-party SDK's docs (Paused/Cancelled/Expired) and
 * are NOT independently confirmed.
 *
 * 2026-08-27 production `listforcustomer` sweep: EVERY recurring item ever
 * created on the real org is `Status: 1` — including the 13-14/08 items that
 * genuinely billed (`Date_PreviousBilling` set, `Date_NextBilling` advanced a
 * month). So `1` is NOT "paused/cancelled" in practice; it is the normal
 * post-creation state, and health has to be read from the dates
 * (`Date_PreviousBilling` / `Date_NextBilling` advancing), not `Status`.
 * `mapSumitRecurringItem` still maps `1 -> 'paused'` below pending a sandbox
 * check of what a fresh healthy item reports; `getSubscription` is currently
 * unused at runtime so this is not on any live path.
 */
const RECURRING_STATUS_MAP: Record<SumitRecurringStatus, PaymentSubscription['status']> = {
  0: 'active',
  1: 'paused',
  2: 'cancelled',
  3: 'expired',
}

export function mapSumitRecurringItem(
  customerId: number,
  record: SumitRecurringItem
): PaymentSubscription {
  const recurringItemId = record.ID != null ? Number(record.ID) : null
  if (!recurringItemId) throw new PaymentError('verification_failed')

  const status =
    record.Status != null ? RECURRING_STATUS_MAP[record.Status] ?? 'pending' : 'pending'

  return {
    id: buildSumitSubscriptionId(customerId, recurringItemId),
    provider: 'sumit',
    customerId: String(customerId),
    planId: null,
    status,
    currentPeriodStart: record.Date_Start ?? null,
    currentPeriodEnd: record.Date_NextBilling ?? null,
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    nextPaymentAt: record.Date_NextBilling ?? null,
    metadata: {
      recurring_item_id: recurringItemId,
      unit_price: record.UnitPrice ?? null,
      quantity: record.Quantity ?? null,
      previous_billing: record.Date_PreviousBilling ?? null,
    },
  }
}
