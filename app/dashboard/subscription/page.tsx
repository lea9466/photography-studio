import { redirect } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { SubscriptionPanel } from '@/components/dashboard/SubscriptionPanel'
import { SubscriptionBillingPanel } from '@/components/dashboard/SubscriptionBillingPanel'
import { SubscriptionPlanBadge } from '@/components/dashboard/SubscriptionPlanBadge'
import type { CurrentSubscriptionView } from '@/lib/payments/payment-service'
import { createPaymentService } from '@/lib/payments/server'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const checkoutSuccess = sp?.checkout === 'success'

  let context
  try {
    context = await requireDashboardContext({ allowWhenSiteUnavailable: true })
  } catch {
    redirect('/login')
  }

  const { userId, supabase, isImpersonating } = context

  const { data: profile } = await supabase
    .from('users')
    .select('trial_end_date, referral_code, slug, is_site_unavailable')
    .eq('id', userId)
    .single()

  const row = profile as {
    trial_end_date: string
    referral_code: string | null
    slug: string | null
    is_site_unavailable?: boolean | null
  } | null

  const referralCode = row?.referral_code || row?.slug || null
  const siteUnavailableLocked =
    !isImpersonating && Boolean(row?.is_site_unavailable)
  const entitlements = await getStudioEntitlements(userId)

  if (!row?.trial_end_date) {
    if (siteUnavailableLocked) {
      // Keep the photographer on billing when the rest of the dashboard is locked.
    } else {
      redirect('/dashboard/galleries')
    }
  }

  let billingStatus: CurrentSubscriptionView = {
    configured: false,
    checkoutEnabled: false,
    isSmokeTestUser: false,
    canStartNewCheckout: true,
    subscription: null,
    availablePlan: null,
    availablePlans: [],
  }
  try {
    const service = createPaymentService()
    if (checkoutSuccess) {
      // S2S verification: activate the local subscription from the provider's
      // record instead of trusting an unverified webhook callback. For SUMIT
      // this is a no-op fallback — activation happens via the dedicated
      // callback route (app/api/payments/webhooks/sumit/return).
      billingStatus = await service.verifySubscription(userId)
    } else {
      billingStatus = await service.getCurrentSubscription(userId)
    }
  } catch (error) {
    console.info('[payments] billing status unavailable', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
  }

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        {siteUnavailableLocked ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-relaxed text-rose-900 md:px-6">
            האתר הציבורי ושאר הדשבורד אינם זמינים כרגע. כאן אפשר לנהל ולשלם
            על המינוי — זה העמוד היחיד שפתוח בינתיים.
          </div>
        ) : null}
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                  מינוי
                </h1>
                <SubscriptionPlanBadge plan={entitlements.isPro ? 'pro' : 'free'} />
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                מעקב אחר תקופת הניסיון ושיתוף עם חברות צלמות
              </p>
            </div>
          </div>
        </div>
        <SubscriptionBillingPanel
          initialStatus={billingStatus}
          isImpersonating={isImpersonating}
          checkoutSuccess={checkoutSuccess}
        />
        {row?.trial_end_date ? (
          <SubscriptionPanel
            trialEndDate={row.trial_end_date}
            referralCode={referralCode}
          />
        ) : null}
      </div>
    </div>
  )
}

