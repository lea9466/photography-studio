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
import { SumitClient } from './sumit-client'
import {
  agorotToSumitAmount,
  assertSumitCustomerCreated,
  mapSumitCheckoutFromRedirect,
  mapSumitCustomer,
  mapSumitFirstRecurringCharge,
  mapSumitRecurringItem,
  parseSumitSubscriptionId,
} from './sumit-mapper'
import type {
  SumitBeginRedirectResponse,
  SumitCancelRecurringResponse,
  SumitChargeRecurringResponse,
  SumitCreateCustomerResponse,
  SumitLineItem,
  SumitListSubscriptionsResponse,
  SumitSetPaymentMethodResponse,
} from './sumit-types'
import { assertSumitCustomerMatches, verifySumitPayment } from './sumit-verify'
import { parseSumitWebhook } from './sumit-webhook'

/**
 * SUMIT adapter.
 *
 * Read this before touching lifecycle behavior:
 *
 * 1. `verifySubscriptionByCorrelation` always returns null and is DEAD for
 *    SUMIT. PayMe accepts our own opaque `subscription_id` as a passthrough
 *    field on generate-subscription and lets us search get-subscriptions by
 *    that same string later — that's what `PaymentService.verifySubscription()`
 *    relies on. SUMIT has no equivalent search-by-arbitrary-string capability,
 *    and this method only receives our bare opaque local id with nothing else
 *    attached — there's nothing to hand SUMIT to resolve it. Real activation
 *    instead happens via the dedicated callback route below (2), which SUMIT
 *    redirects the browser to directly and which does its own S2S verification
 *    — `verifySubscriptionByCorrelation` is only a secondary/legacy fallback
 *    path in the generic code and is expected to no-op for SUMIT.
 *
 * 2. `createCheckoutSession` and `updatePaymentMethod` both point SUMIT's
 *    redirect back at `app/api/payments/webhooks/sumit/return/route.ts` — a
 *    new route outside this directory (only file touched outside
 *    providers/sumit + provider-factory.ts, added because there is no other
 *    way to receive SUMIT's `OG-PaymentID` after the browser returns). That
 *    route calls `completeHostedCheckout` / `completePaymentMethodUpdate`
 *    below to finish the job. Both `/billing/payments/beginredirect/` calls
 *    here always use `AuthoriseOnly: 'true'` — they only capture/validate a
 *    card, they never move money. The real charge (checkout) happens once,
 *    server-side, via /billing/recurring/charge/ inside `completeHostedCheckout`
 *    — this avoids double-charging (a live test proved beginredirect DOES
 *    return a full reusable CreditCard_Token despite a third-party SDK comment
 *    claiming redirect mode has "no support for recurring, tokens").
 *
 * 3. `getSubscription` and `cancelSubscription` DO work directly, using a
 *    workaround: SUMIT's /billing/recurring/listforcustomer/ and confirmed-live
 *    /billing/recurring/cancel/ endpoints both require a `Customer.ID` that
 *    the bare `externalSubscriptionId` string doesn't carry on its own. Since
 *    that id is opaque to the rest of the codebase (just stored as text and
 *    echoed back), `mapSumitFirstRecurringCharge` encodes both the SUMIT
 *    customer id and the recurring item id into it (`buildSumitSubscriptionId`
 *    / `parseSumitSubscriptionId`) — entirely inside this directory.
 *
 *    Also note: a live test call (2026-08-13) showed SUMIT DOES track and
 *    auto-schedule `Date_NextBilling` on its own after the first recurring
 *    charge — unlike the earlier assumption (from SUMIT's third-party SDK's
 *    own cron helper) that billing is purely merchant-initiated. That's why
 *    `cancelSubscription` calling the real endpoint matters: without it, SUMIT
 *    may keep billing on schedule with nothing in this codebase able to stop
 *    it. The exact meaning of the resulting Status value (1) is not fully
 *    confirmed — see the comment on `RECURRING_STATUS_MAP` in sumit-mapper.ts
 *    — but it does exclude the item from an IncludeInactive:false listing.
 *
 * Endpoints and field names below come from SUMIT's own maintained Laravel SDK
 * (github.com/nm-digitalhub/SUMIT-Payment-Gateway-for-laravel) plus live test
 * calls against a real SUMIT account (2026-08-13, noted inline where relevant)
 * — SUMIT's public Swagger UI renders client-side with no fetchable spec.
 */
export class SumitProvider implements PaymentProvider {
  readonly name = 'sumit' as const
  private clientInstance: SumitClient | null = null

  constructor(client?: SumitClient) {
    this.clientInstance = client ?? null
  }

  private client() {
    if (!this.clientInstance) this.clientInstance = new SumitClient()
    return this.clientInstance
  }

  async createCustomer(input: CreateCustomerInput): Promise<PaymentCustomer> {
    // SUMIT has no separate display-name field available to us here — the
    // repository only supplies email — so email doubles as Name.
    const response = await this.client().postJson<SumitCreateCustomerResponse>(
      '/accounting/customers/create/',
      {
        Details: {
          Name: input.email,
          EmailAddress: input.email,
        },
      }
    )
    const customerId = assertSumitCustomerCreated(response)
    return mapSumitCustomer({ customerId, email: input.email })
  }

  /**
   * Uses /billing/payments/beginredirect/, SUMIT's hosted card-capture page,
   * purely to capture/validate a card (always AuthoriseOnly — see class doc
   * (2)). The real charge happens afterward in `completeHostedCheckout`, once
   * the callback route receives SUMIT's redirect back.
   */
  async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CheckoutSession> {
    if (!input.customer?.id) {
      // payment-service.ts always resolves/creates the billing customer via
      // createCustomer() before calling this — a missing id means that
      // invariant broke, not a case we can recover from here.
      throw new PaymentError('invalid_request')
    }
    if (!input.localSubscriptionId) {
      // Required to correlate the callback back to the pending local row —
      // payment-service.ts always generates and passes one.
      throw new PaymentError('invalid_request')
    }

    const item: SumitLineItem = {
      Item: { Name: input.plan.name, SearchMode: 'Automatic' },
      Quantity: 1,
      UnitPrice: 1,
      Currency: input.plan.currency.toUpperCase(),
    }

    const redirectUrl = buildSumitReturnUrl({
      mode: 'checkout',
      params: { local_subscription_id: input.localSubscriptionId },
      next: input.successUrl,
    })

    const response = await this.client().postJson<SumitBeginRedirectResponse>(
      '/billing/payments/beginredirect/',
      {
        Items: [item],
        Customer: { ID: Number(input.customer.id) },
        VATIncluded: 'true',
        DocumentLanguage: 'Hebrew',
        RedirectURL: redirectUrl,
        CancelRedirectURL: input.cancelUrl,
        AuthoriseOnly: 'true',
      }
    )

    return mapSumitCheckoutFromRedirect(response)
  }

  /**
   * Second half of checkout — called by the callback route after SUMIT
   * redirects the browser back with `OG-PaymentID`. Verifies the capture S2S,
   * confirms the amount matches what checkout was supposed to charge (the
   * beginredirect item price is a fixed ₪1 placeholder — see
   * `createCheckoutSession` — so this is the actual charge, not a duplicate),
   * then performs the real charge + establishes the recurring authorization.
   *
   * SECURITY: `expectedCustomerId` is required and checked. Without it, an
   * attacker could start their own checkout (getting their own
   * local_subscription_id), then call this callback route with a DIFFERENT,
   * real `OG-PaymentID` belonging to another one of your Sumit customers —
   * establishing a recurring authorization (and an active subscription in
   * their own account) against a stranger's stored card. `OG-PaymentID`
   * values observed in testing are small sequential integers, not random —
   * treat them as guessable/enumerable, never as proof of ownership on their
   * own. The GET call is scoped to your CompanyID, but not to any one
   * customer, so this check is the only thing standing between "a valid
   * payment exists" and "this payment belongs to the customer we started
   * checkout for".
   */
  async completeHostedCheckout(input: {
    paymentId: number
    expectedAmountAgorot: number
    expectedCustomerId: number
    itemName: string
    currency: string
  }): Promise<PaymentSubscription> {
    const verified = await verifySumitPayment(this.client(), input.paymentId)
    assertSumitCustomerMatches(verified, input.expectedCustomerId)
    // The beginredirect capture itself was AuthoriseOnly (₪1, unrelated to the
    // real price) — nothing to compare it against yet. Amount verification
    // happens against the REAL charge response below instead.

    const item: SumitLineItem = {
      Item: { Name: input.itemName, SearchMode: 'Automatic' },
      Quantity: 1,
      UnitPrice: agorotToSumitAmount(input.expectedAmountAgorot),
      Currency: input.currency.toUpperCase(),
    }

    const response = await this.client().postJson<SumitChargeRecurringResponse>(
      '/billing/recurring/charge/',
      {
        Customer: { ID: verified.customerId },
        PaymentMethod: {
          CreditCard_Token: verified.token,
          CreditCard_ExpirationMonth: verified.expirationMonth,
          CreditCard_ExpirationYear: verified.expirationYear,
          Type: 1,
        },
        Items: [item],
        VATIncluded: 'true',
        SendDocumentByEmail: 'true',
        DocumentDescription: input.itemName,
        DocumentLanguage: 'Hebrew',
        AuthoriseOnly: this.client().env.testMode ? 'true' : 'false',
      }
    )

    const subscription = mapSumitFirstRecurringCharge(response)
    const chargedAmount = response.Data?.Payment?.Amount ?? 0
    if (Math.abs(chargedAmount - agorotToSumitAmount(input.expectedAmountAgorot)) > 0.001) {
      throw new PaymentError('verification_failed', {
        detail: `SUMIT recurring charge amount mismatch: got ${chargedAmount}, expected ${agorotToSumitAmount(input.expectedAmountAgorot)}`,
      })
    }
    return subscription
  }

  /**
   * Charges once and establishes the recurring authorization in the same
   * call, given a SUMIT card token (`paymentToken`) obtained out-of-band via
   * PaymentsJS. Not currently wired to any caller — mirrors PayMe's own
   * `createSubscription`, which also throws `provider_not_configured` today.
   *
   * CONFIRMED BY LIVE TESTING (2026-08-13): SUMIT rejects a token-only
   * PaymentMethod with "Missing CreditCard_ExpirationMonth/CreditCard_ExpirationYear"
   * — the token alone is not enough. `CreateSubscriptionInput.paymentToken` is
   * a bare string with nowhere to carry expiration, so this will fail against
   * a real token until a caller is wired up with a way to supply it (e.g. a
   * `token|MM|YYYY` convention decided at that point, entirely within this
   * file, same pattern as `buildSumitSubscriptionId`).
   */
  async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<PaymentSubscription> {
    if (!input.paymentToken) {
      throw new PaymentError('provider_not_configured')
    }

    const item: SumitLineItem = {
      Item: { Name: input.plan.name, SearchMode: 'Automatic' },
      Quantity: 1,
      UnitPrice: agorotToSumitAmount(input.plan.amountAgorot),
      Currency: input.plan.currency.toUpperCase(),
    }

    const response = await this.client().postJson<SumitChargeRecurringResponse>(
      '/billing/recurring/charge/',
      {
        Customer: { ID: Number(input.customerId) },
        PaymentMethod: { CreditCard_Token: input.paymentToken, Type: 1 },
        Items: [item],
        VATIncluded: 'true',
        SendDocumentByEmail: 'true',
        DocumentDescription: input.plan.name,
        DocumentLanguage: 'Hebrew',
      }
    )

    return mapSumitFirstRecurringCharge(response)
  }

  /**
   * See class doc (2). Lists all recurring items for the encoded customer id
   * and picks out the one matching the encoded recurring item id — SUMIT has
   * no single-item "get by id" endpoint, only list-for-customer.
   */
  async getSubscription(externalSubscriptionId: string): Promise<PaymentSubscription> {
    const parsed = parseSumitSubscriptionId(externalSubscriptionId)
    if (!parsed) throw new PaymentError('subscription_not_found')

    const response = await this.client().postJson<SumitListSubscriptionsResponse>(
      '/billing/recurring/listforcustomer/',
      {
        Customer: { ID: parsed.customerId },
        IncludeInactive: 'true',
      }
    )
    const record = response.Data?.RecurringItems?.find(
      (item) => Number(item.ID) === parsed.recurringItemId
    )
    if (!record) throw new PaymentError('subscription_not_found')

    return mapSumitRecurringItem(parsed.customerId, record)
  }

  /**
   * See class doc (2)/(3). Calls the confirmed-live /billing/recurring/cancel/
   * endpoint. `atPeriodEnd` is accepted for interface compatibility but SUMIT's
   * cancel call has no "at period end" option — it takes effect immediately
   * (a real test call confirmed the item drops out of an active-only listing
   * right away, not at the next billing date).
   */
  async cancelSubscription(
    input: CancelSubscriptionInput
  ): Promise<PaymentSubscription> {
    const parsed = parseSumitSubscriptionId(input.externalSubscriptionId)
    if (!parsed) throw new PaymentError('subscription_not_found')

    const response = await this.client().postJson<SumitCancelRecurringResponse>(
      '/billing/recurring/cancel/',
      {
        Customer: { ID: parsed.customerId },
        RecurringCustomerItemID: parsed.recurringItemId,
      }
    )
    if ((response.Status ?? 1) !== 0) {
      throw new PaymentError('provider_unavailable', {
        status: 422,
        cause: `SUMIT recurring cancel failed: status=${response.Status} message=${response.UserErrorMessage ?? ''}`,
      })
    }

    const now = new Date().toISOString()
    return {
      id: input.externalSubscriptionId,
      provider: 'sumit',
      customerId: String(parsed.customerId),
      planId: null,
      status: 'cancelled',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      cancelledAt: now,
      nextPaymentAt: null,
      metadata: {
        recurring_item_id: parsed.recurringItemId,
        cancelled_via: 'sumit-billing-recurring-cancel',
      },
    }
  }

  /**
   * Same card-capture pattern as `createCheckoutSession` (see class doc (2)):
   * a ₪1 AuthoriseOnly beginredirect capture, completed by the callback route
   * calling `completePaymentMethodUpdate` below. Unlike checkout, no real
   * charge follows — only /billing/paymentmethods/setforcustomer/.
   */
  async updatePaymentMethod(input: UpdatePaymentMethodInput): Promise<CheckoutSession> {
    const item: SumitLineItem = {
      Item: { Name: 'עדכון אמצעי תשלום', SearchMode: 'Automatic' },
      Quantity: 1,
      UnitPrice: 1,
      Currency: input.plan.currency.toUpperCase(),
    }

    const redirectUrl = buildSumitReturnUrl({
      mode: 'update_payment_method',
      params: { expected_customer_id: input.externalCustomerId },
      next: input.returnUrl,
    })

    const response = await this.client().postJson<SumitBeginRedirectResponse>(
      '/billing/payments/beginredirect/',
      {
        Items: [item],
        Customer: { ID: Number(input.externalCustomerId) },
        VATIncluded: 'true',
        DocumentLanguage: 'Hebrew',
        RedirectURL: redirectUrl,
        CancelRedirectURL: input.returnUrl,
        AuthoriseOnly: 'true',
      }
    )

    return mapSumitCheckoutFromRedirect(response)
  }

  /**
   * Second half of an "update payment method" flow — called by the callback
   * route after SUMIT redirects back. Verifies the capture S2S, confirms it
   * belongs to the expected customer (not just any valid SUMIT payment), then
   * sets it as that customer's default stored payment method.
   */
  async completePaymentMethodUpdate(input: {
    paymentId: number
    expectedCustomerId: number
  }): Promise<void> {
    const verified = await verifySumitPayment(this.client(), input.paymentId)
    assertSumitCustomerMatches(verified, input.expectedCustomerId)

    const response = await this.client().postJson<SumitSetPaymentMethodResponse>(
      '/billing/paymentmethods/setforcustomer/',
      {
        Customer: { ID: verified.customerId },
        PaymentMethod: {
          CreditCard_Token: verified.token,
          CreditCard_ExpirationMonth: verified.expirationMonth,
          CreditCard_ExpirationYear: verified.expirationYear,
          Type: 1,
        },
      }
    )
    if ((response.Status ?? 1) !== 0) {
      throw new PaymentError('provider_unavailable', {
        status: 422,
        cause: `SUMIT setforcustomer failed: status=${response.Status} message=${response.UserErrorMessage ?? ''}`,
      })
    }
  }

  /**
   * See class doc (1): always returns null. There is no SUMIT-side lookup
   * this method can perform — it receives only our opaque local id, and
   * SUMIT has no endpoint to search by an arbitrary merchant-supplied string.
   */
  async verifySubscriptionByCorrelation(
    localSubscriptionId: string
  ): Promise<PaymentSubscription | null> {
    void localSubscriptionId
    return null
  }

  async parseWebhook(input: ParseWebhookInput): Promise<WebhookEvent> {
    return parseSumitWebhook(input)
  }
}

/**
 * Builds the RedirectURL SUMIT sends the browser back to after a hosted
 * capture — always the callback route (see class doc (2)), never `next`
 * directly, since SUMIT's own `OG-PaymentID` must be verified S2S before
 * anything in `next` is trusted. `next` is carried through as a query param
 * and only used as the final destination once verification succeeds.
 */
function buildSumitReturnUrl(input: {
  mode: 'checkout' | 'update_payment_method'
  params: Record<string, string>
  next: string
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (!appUrl) throw new PaymentError('provider_not_configured')

  const url = new URL(`${appUrl}/api/payments/webhooks/sumit/return`)
  url.searchParams.set('sumit_mode', input.mode)
  url.searchParams.set('next', input.next)
  for (const [key, value] of Object.entries(input.params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}
