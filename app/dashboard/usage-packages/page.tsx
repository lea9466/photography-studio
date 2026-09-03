import { redirect } from 'next/navigation'
import { Layers } from 'lucide-react'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { PrivateGalleriesSubscriptionPanel } from '@/components/dashboard/PrivateGalleriesSubscriptionPanel'
import { GalleryPassPackagesSection } from '@/components/dashboard/GalleryPassPackagesSection'
import type { CurrentSubscriptionView } from '@/lib/payments/payment-service'
import { createPaymentService } from '@/lib/payments/server'
import { getPrivateGalleryQuota } from '@/lib/actions/gallery.actions'
import { isPrivateGalleryCheckoutEnabled } from '@/lib/payments/flags'
import { getAllPrivateGalleryTierLimits } from '@/lib/private-galleries/loader'
import { fetchActiveGalleryPassBundles } from '@/lib/gallery-pass/loader'
import { fetchAvailableGalleryPassCredits } from '@/lib/gallery-pass/credits'

export default async function UsagePackagesPage({
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

  const { userId, isImpersonating } = context

  let billingStatus: CurrentSubscriptionView = {
    configured: false,
    checkoutEnabled: false,
    oneTimePaymentEnabled: false,
    paymentsFormEnabled: false,
    maintenance: false,
    isSmokeTestUser: false,
    canStartNewCheckout: true,
    subscription: null,
    availablePlan: null,
    availablePlans: [],
  }
  try {
    const service = createPaymentService()
    // S2S verification: activate the local subscription from the provider's
    // record instead of trusting an unverified webhook callback. For SUMIT
    // this is a no-op fallback — activation happens via the dedicated
    // callback route (app/api/payments/webhooks/sumit/return).
    billingStatus = checkoutSuccess
      ? await service.verifySubscription(userId, 'private_galleries')
      : await service.getCurrentSubscription(userId, 'private_galleries')
  } catch (error) {
    console.info('[private-galleries] billing status unavailable', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
  }

  const quota = await getPrivateGalleryQuota().catch((error) => {
    console.info('[private-galleries] quota unavailable', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
    return null
  })

  const tierLimits = await getAllPrivateGalleryTierLimits().catch((error) => {
    console.info('[private-galleries] tier limits unavailable', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
    return []
  })

  const [passBundles, passCredits] = await Promise.all([
    fetchActiveGalleryPassBundles().catch(() => []),
    fetchAvailableGalleryPassCredits(userId).catch(() => []),
  ])

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <Layers className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                חבילות שימוש
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                מסלול נפרד למכסת הגלריות הפרטיות שלך — כמה גלריות לקוח אפשר לנהל
                ובאיזה גודל, בנפרד לגמרי מהמנוי לאתר הציבורי
              </p>
            </div>
          </div>
        </div>

        <PrivateGalleriesSubscriptionPanel
          initialStatus={billingStatus}
          quota={quota}
          isImpersonating={isImpersonating}
          checkoutEnabled={isPrivateGalleryCheckoutEnabled()}
          tierLimits={tierLimits}
        />

        <GalleryPassPackagesSection
          isImpersonating={isImpersonating}
          creditsCount={passCredits.length}
          bundles={passBundles.map((b) => ({
            code: b.code,
            name: b.name,
            photoCap: b.photo_cap,
            validityDays: b.validity_days,
            amountAgorot: b.amount_agorot,
          }))}
        />
      </div>
    </div>
  )
}
