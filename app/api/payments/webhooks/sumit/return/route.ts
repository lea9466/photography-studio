import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseBillingRepository } from '@/lib/payments/repository'
import { SumitProvider } from '@/lib/payments/providers/sumit/sumit-provider'

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
    } else if (mode === 'update_payment_method') {
      await handleUpdatePaymentMethod(provider, params, paymentId)
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
