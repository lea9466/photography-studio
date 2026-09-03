import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseBillingRepository } from '@/lib/payments/repository'
import { SumitProvider } from '@/lib/payments/providers/sumit/sumit-provider'
import { CUSTOM_DOMAIN_ADDON_PRICE_AGOROT } from '@/lib/domains/custom-domain-addon'
import { reactivateSuspendedCustomDomains } from '@/lib/domains/custom-domain-suspension'
import { fetchGalleryPassBundleById } from '@/lib/gallery-pass/loader'

export const runtime = 'nodejs'

/**
 * SUMIT has no async payment/subscription webhook (see sumit-webhook.ts) — the
 * only way to learn a hosted-page capture succeeded is this browser redirect,
 * which SUMIT sends back with `OG-PaymentID` appended to whatever RedirectURL
 * `SumitProvider` built. `next` (also our own param) is only ever trusted as a
 * destination — nothing about the outcome is trusted until verified S2S below.
 *
 * Deliberately unauthenticated: correlation is either an unguessable, randomly
 * generated local subscription id (checkout) or a real SUMIT customer id we
 * already resolved server-side (payment-method update), and every outcome is
 * re-verified against SUMIT's API before any DB write — same trust model as
 * `payme-webhook.ts` / `verifySubscriptionByCorrelation` elsewhere in this codebase.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') || ''
  const next = resolveSafeNext(params.get('next'), appUrl)

  const mode = params.get('sumit_mode')
  const paymentId = Number(params.get('OG-PaymentID'))

  if (!Number.isFinite(paymentId)) {
    console.error('[payments][sumit-return] missing/invalid OG-PaymentID', { mode })
    return NextResponse.redirect(withCheckoutError(next))
  }

  const provider = new SumitProvider()

  try {
    if (mode === 'checkout') {
      await handleCheckout(provider, params, paymentId)
    } else if (mode === 'one_time_checkout') {
      await handleOneTimeCheckout(provider, params, paymentId)
    } else if (mode === 'update_payment_method') {
      await handleUpdatePaymentMethod(provider, params, paymentId)
    } else if (mode === 'custom_domain_addon') {
      await handleCustomDomainAddonCheckout(provider, params, paymentId)
    } else if (mode === 'gallery_pass') {
      await handleGalleryPassCheckout(provider, params, paymentId)
    } else {
      console.error('[payments][sumit-return] unknown sumit_mode', { mode })
      return NextResponse.redirect(withCheckoutError(next))
    }
  } catch (error) {
    console.error('[payments][sumit-return] failed', {
      mode,
      paymentId,
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
    })
    // Return a safe, user-facing failure state. The local subscription stays
    // pending until a verified provider result is available.
    return NextResponse.redirect(withCheckoutError(next))
  }

  return NextResponse.redirect(next)
}

function withCheckoutError(next: string): string {
  const url = new URL(next)
  url.searchParams.set('checkout', 'error')
  return url.toString()
}

/**
 * SECURITY: `next` is an attacker-controllable query param — without this
 * check, `?next=https://evil.example/phish` would make this endpoint an open
 * redirect (the route always redirects to `next`, even on verification
 * failure, so this isn't gated behind a successful payment). Only ever
 * redirect within our own app.
 */
function resolveSafeNext(next: string | null, appUrl: string): string {
  const fallback = `${appUrl}/dashboard/subscription`
  if (!next) return fallback
  try {
    const parsed = new URL(next, appUrl)
    if (appUrl && parsed.origin !== new URL(appUrl).origin) return fallback
    return parsed.toString()
  } catch {
    return fallback
  }
}

async function handleCheckout(
  provider: SumitProvider,
  params: URLSearchParams,
  paymentId: number
) {
  const localSubscriptionId = params.get('local_subscription_id')
  if (!localSubscriptionId) throw new Error('missing local_subscription_id')

  const repository = new SupabaseBillingRepository(createAdminClient())
  const row = await repository.getSubscriptionByExternalId('sumit', localSubscriptionId)
  if (!row) {
    console.info('[payments][sumit-return] no pending row for correlation id — ignoring', {
      localSubscriptionId,
    })
    return
  }
  // Idempotent: replaying this URL (back button, retry) must not charge twice.
  if (row.status !== 'pending') {
    console.info('[payments][sumit-return] row already resolved — skipping', {
      subscriptionId: row.id,
      status: row.status,
    })
    return
  }

  const plan = row.plan_id ? await repository.getPlanById(row.plan_id) : null
  if (!plan) throw new Error(`plan not found for subscription ${row.id}`)

  const billingCustomer = await repository.getBillingCustomer(row.user_id, 'sumit')
  const expectedCustomerId = Number(billingCustomer?.provider_customer_id)
  if (!Number.isFinite(expectedCustomerId)) {
    throw new Error(`no sumit billing customer found for user ${row.user_id}`)
  }

  const metadata = (row.provider_metadata ?? {}) as Record<string, unknown>
  // payment-service.ts stores the smoke-test price separately from the plan's
  // real amount_agorot (metadata.amount_agorot is always the FULL plan price,
  // even on a smoke-test row) — without this check a smoke-test checkout
  // would get charged the real plan price instead of the discounted amount.
  const expectedAmountAgorot =
    metadata.smoke_test === true && typeof metadata.smoke_test_price_agorot === 'number'
      ? metadata.smoke_test_price_agorot
      : typeof metadata.amount_agorot === 'number'
        ? metadata.amount_agorot
        : plan.amount_agorot

  const subscription = await provider.completeHostedCheckout({
    paymentId,
    expectedAmountAgorot,
    expectedCustomerId,
    itemName: plan.name,
    currency: plan.currency,
  })

  const now = new Date().toISOString()
  await repository.updateSubscription(row.id, {
    status: subscription.status,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    nextPaymentAt: subscription.nextPaymentAt,
    lastPaymentAt: now,
    providerSubscriptionId: subscription.id,
  })

  // A domain suspended while she had no entitlement (see
  // lib/domains/custom-domain-suspension.ts) reactivates the moment a real
  // subscription goes active — no waiting for the reconciliation cron.
  if (subscription.status === 'active') {
    await reactivateSuspendedCustomDomains(row.user_id)
  }
}

/**
 * One-time payment completion — mirrors `handleCheckout` but calls
 * `completeOneTimeCheckout` (verify-only, the real charge already happened
 * inside `beginredirect`) instead of `completeHostedCheckout`, and computes
 * `current_period_end` locally from the `one_time_months` stashed in
 * provider_metadata at checkout creation (lib/payments/payment-service.ts
 * `createOneTimeCheckout`) since SUMIT never tracks a period for a bare
 * one-time payment (no recurring item).
 */
async function handleOneTimeCheckout(
  provider: SumitProvider,
  params: URLSearchParams,
  paymentId: number
) {
  const localSubscriptionId = params.get('local_subscription_id')
  if (!localSubscriptionId) throw new Error('missing local_subscription_id')

  const repository = new SupabaseBillingRepository(createAdminClient())
  const row = await repository.getSubscriptionByExternalId('sumit', localSubscriptionId)
  if (!row) {
    console.info('[payments][sumit-return] no pending row for correlation id — ignoring', {
      localSubscriptionId,
    })
    return
  }
  if (row.status !== 'pending') {
    console.info('[payments][sumit-return] row already resolved — skipping', {
      subscriptionId: row.id,
      status: row.status,
    })
    return
  }

  const plan = row.plan_id ? await repository.getPlanById(row.plan_id) : null
  if (!plan) throw new Error(`plan not found for subscription ${row.id}`)

  const billingCustomer = await repository.getBillingCustomer(row.user_id, 'sumit')
  const expectedCustomerId = Number(billingCustomer?.provider_customer_id)
  if (!Number.isFinite(expectedCustomerId)) {
    throw new Error(`no sumit billing customer found for user ${row.user_id}`)
  }

  const metadata = (row.provider_metadata ?? {}) as Record<string, unknown>
  const expectedAmountAgorot =
    typeof metadata.amount_agorot === 'number' ? metadata.amount_agorot : plan.amount_agorot
  const months =
    typeof metadata.one_time_months === 'number' && metadata.one_time_months >= 1
      ? metadata.one_time_months
      : 1

  const subscription = await provider.completeOneTimeCheckout({
    paymentId,
    expectedAmountAgorot,
    expectedCustomerId,
  })

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + months)

  await repository.updateSubscription(row.id, {
    status: subscription.status,
    periodStart: now.toISOString(),
    periodEnd: periodEnd.toISOString(),
    nextPaymentAt: null,
    lastPaymentAt: now.toISOString(),
    providerSubscriptionId: subscription.id,
  })

  const oneTimePaymentId = subscription.metadata?.payment_id
  await repository
    .upsertTransaction({
      userId: row.user_id,
      subscriptionId: row.id,
      provider: 'sumit',
      externalTransactionId:
        oneTimePaymentId != null ? String(oneTimePaymentId) : `${localSubscriptionId}:onetime`,
      status: 'succeeded',
      amountAgorot: expectedAmountAgorot,
      currency: plan.currency,
      paidAt: now.toISOString(),
      metadata: { flow: 'one_time', one_time_months: months },
    })
    .catch((error) => {
      console.error('[payments][sumit-return] one-time transaction record failed', {
        subscriptionId: row.id,
        message: error instanceof Error ? error.message : String(error),
      })
    })

  // See the matching comment in handleCheckout above.
  if (subscription.status === 'active') {
    await reactivateSuspendedCustomDomains(row.user_id)
  }
}

async function handleUpdatePaymentMethod(
  provider: SumitProvider,
  params: URLSearchParams,
  paymentId: number
) {
  const expectedCustomerId = Number(params.get('expected_customer_id'))
  if (!Number.isFinite(expectedCustomerId)) throw new Error('missing expected_customer_id')

  await provider.completePaymentMethodUpdate({ paymentId, expectedCustomerId })
}

/**
 * Standalone one-time ₪99 addon that unlocks custom_domain independent of
 * subscription tier (lib/subscriptions/entitlements.ts's buildFeatures) —
 * see `createAddonCheckout`'s doc comment for why the studio to credit is
 * resolved from the SUMIT-*verified* customer id (`billing_customers`
 * reverse lookup) rather than trusted directly off any request param: a
 * `user_id` query param here would let anyone redirect a real payment's
 * credit onto a different account by editing the return URL.
 */
async function handleCustomDomainAddonCheckout(
  provider: SumitProvider,
  params: URLSearchParams,
  paymentId: number
) {
  const expectedCustomerId = Number(params.get('expected_customer_id'))
  if (!Number.isFinite(expectedCustomerId)) throw new Error('missing expected_customer_id')

  const verified = await provider.completeAddonCheckout({
    paymentId,
    expectedAmountAgorot: CUSTOM_DOMAIN_ADDON_PRICE_AGOROT,
    expectedCustomerId,
  })

  const admin = createAdminClient()
  const repository = new SupabaseBillingRepository(admin)

  const billingCustomer = await repository.getBillingCustomerByExternalId(
    'sumit',
    String(verified.customerId)
  )
  const userId = (billingCustomer as { user_id: string } | null)?.user_id
  if (!userId) {
    throw new Error(`no billing_customers row for verified SUMIT customer ${verified.customerId}`)
  }

  const now = new Date().toISOString()

  // Idempotent by construction: only sets the flag the first time it's ever
  // null, so a replayed return URL (back button, refresh) after a first
  // successful run is a harmless no-op rather than re-stamping the purchase
  // date. The DB write is a single atomic UPDATE ... WHERE ... IS NULL, not
  // read-then-write, so a genuine race between two callbacks can't double-set.
  const { error: userUpdateError } = await admin
    .from('users')
    .update({ custom_domain_addon_purchased_at: now } as never)
    .eq('id', userId)
    .is('custom_domain_addon_purchased_at', null)
  if (userUpdateError) {
    throw new Error(`failed to record custom-domain addon purchase: ${userUpdateError.message}`)
  }

  await reactivateSuspendedCustomDomains(userId)

  await repository
    .upsertTransaction({
      userId,
      subscriptionId: null,
      provider: 'sumit',
      externalTransactionId: String(paymentId),
      status: 'succeeded',
      amountAgorot: CUSTOM_DOMAIN_ADDON_PRICE_AGOROT,
      currency: 'ILS',
      paidAt: now,
      metadata: { flow: 'custom_domain_addon' },
    })
    .catch((error) => {
      console.error('[payments][sumit-return] custom-domain addon transaction record failed', {
        userId,
        message: error instanceof Error ? error.message : String(error),
      })
    })
}

/**
 * One-time "gallery pass" purchase — a pay-per-gallery bundle bought at
 * gallery-creation time (see lib/actions/gallery-pass.actions.ts). Same trust
 * model as handleCustomDomainAddonCheckout: the expected amount is re-derived
 * server-side from the gallery's stored bundle (never a request param), the
 * studio is resolved from the SUMIT-verified customer, and the `gallery_id`
 * param is only used to locate the row — it's cross-checked against that
 * resolved studio before anything is written.
 */
async function handleGalleryPassCheckout(
  provider: SumitProvider,
  params: URLSearchParams,
  paymentId: number
) {
  const expectedCustomerId = Number(params.get('expected_customer_id'))
  if (!Number.isFinite(expectedCustomerId)) throw new Error('missing expected_customer_id')

  const galleryId = params.get('gallery_id')?.trim()
  if (!galleryId) throw new Error('missing gallery_id')

  const admin = createAdminClient()
  const repository = new SupabaseBillingRepository(admin)

  const { data: galleryRow } = await admin
    .from('galleries')
    .select('id, user_id, pass_bundle_id, pass_purchased_at')
    .eq('id', galleryId)
    .maybeSingle()
  const gallery = galleryRow as
    | { id: string; user_id: string; pass_bundle_id: string | null; pass_purchased_at: string | null }
    | null
  if (!gallery || !gallery.pass_bundle_id) {
    throw new Error(`gallery ${galleryId} has no pending gallery pass`)
  }

  const bundle = await fetchGalleryPassBundleById(gallery.pass_bundle_id)
  if (!bundle) throw new Error(`gallery pass bundle ${gallery.pass_bundle_id} not found`)

  const verified = await provider.completeAddonCheckout({
    paymentId,
    expectedAmountAgorot: bundle.amount_agorot,
    expectedCustomerId,
  })

  const billingCustomer = await repository.getBillingCustomerByExternalId(
    'sumit',
    String(verified.customerId)
  )
  const userId = (billingCustomer as { user_id: string } | null)?.user_id
  if (!userId) {
    throw new Error(`no billing_customers row for verified SUMIT customer ${verified.customerId}`)
  }
  if (userId !== gallery.user_id) {
    throw new Error(
      `gallery-pass payment customer ${verified.customerId} does not own gallery ${galleryId}`
    )
  }

  const now = new Date().toISOString()

  // Atomic + idempotent: only stamps a gallery whose pass is still unpaid, so a
  // replayed return URL (back button, refresh) is a harmless no-op.
  const { error: updateError } = await admin
    .from('galleries')
    .update({ pass_purchased_at: now } as never)
    .eq('id', galleryId)
    .is('pass_purchased_at', null)
  if (updateError) {
    throw new Error(`failed to record gallery-pass purchase: ${updateError.message}`)
  }

  await repository
    .upsertTransaction({
      userId,
      subscriptionId: null,
      provider: 'sumit',
      externalTransactionId: String(paymentId),
      status: 'succeeded',
      amountAgorot: bundle.amount_agorot,
      currency: bundle.currency,
      paidAt: now,
      metadata: { flow: 'gallery_pass', gallery_id: galleryId, bundle_code: bundle.code },
    })
    .catch((error) => {
      console.error('[payments][sumit-return] gallery-pass transaction record failed', {
        userId,
        galleryId,
        message: error instanceof Error ? error.message : String(error),
      })
    })
}
