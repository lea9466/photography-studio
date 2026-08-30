import { redirect } from 'next/navigation'

import { Globe } from 'lucide-react'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { CustomDomainSetting } from '@/components/dashboard/CustomDomainSetting'
import { CustomDomainExplainer } from '@/components/dashboard/CustomDomainExplainer'
import { ProFeatureLockedPage } from '@/components/dashboard/ProFeatureLockedPage'
import { CustomDomainAddonPurchaseButton } from '@/components/dashboard/CustomDomainAddonPurchaseButton'
import { CustomDomainAddonReturnToast } from '@/components/dashboard/CustomDomainAddonReturnToast'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { isVercelConfigured, VERCEL_CNAME_TARGET, VERCEL_APEX_A_RECORD } from '@/lib/vercel/config'
import { CUSTOM_DOMAIN_ADDON_PRICE_ILS } from '@/lib/domains/custom-domain-addon'
import type { CustomDomain } from '@/lib/types/database.types'

export default async function CustomDomainPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context
  const entitlements = await getStudioEntitlements(userId)
  const canConnectCustomDomain = entitlements.features.custom_domain
  const vercelReady = isVercelConfigured()

  // Fetch whenever Vercel is configured, regardless of current Pro status —
  // a photographer who connected a domain on Pro and later downgraded must
  // still be able to see and disconnect it, even though she can no longer
  // connect a NEW one (enforced server-side either way, see
  // assertFeatureAllowed in custom-domain.actions.ts).
  let customDomain: CustomDomain | null = null
  if (vercelReady) {
    const { data: domainRow } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    customDomain = (domainRow as CustomDomain | null) ?? null
  }

  const header = (
    <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
      <div className="relative flex items-start gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
          <Globe className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
            דומיין אישי
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
            חברי דומיין משלך כדי שהאתר יופיע בכתובת שלך במקום כתובת ה-slug.
          </p>
        </div>
      </div>
    </div>
  )

  // Never hides an existing connection just because she's no longer Pro —
  // only blocks connecting a NEW domain when neither condition holds.
  const canManage = canConnectCustomDomain || customDomain !== null

  if (!canManage) {
    return (
      <div className="animate-fade-in">
        <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
          <CustomDomainAddonReturnToast />
          {header}
          <CustomDomainExplainer />
          <ProFeatureLockedPage
            title="דומיין אישי דורש מנוי בתשלום"
            description={`הפיצ'ר הזה לא כלול בתקופת הניסיון — שדרגי למנוי, או פתחי רק אותו בנפרד בעלות חד-פעמית של ₪${CUSTOM_DOMAIN_ADDON_PRICE_ILS}, בלי צורך במנוי מלא.`}
            secondaryAction={
              <CustomDomainAddonPurchaseButton priceLabel={`₪${CUSTOM_DOMAIN_ADDON_PRICE_ILS}`} />
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <CustomDomainAddonReturnToast />
        {header}
        <CustomDomainExplainer />
        {vercelReady ? (
          <CustomDomainSetting
            key={customDomain?.id ?? 'none'}
            initialDomain={customDomain}
            cnameTarget={VERCEL_CNAME_TARGET}
            apexARecord={VERCEL_APEX_A_RECORD}
            canConnect={canConnectCustomDomain}
          />
        ) : (
          <div className="rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 text-sm text-[--muted]">
            התכונה עדיין לא זמינה — חוזרות בקרוב.
          </div>
        )}
      </div>
    </div>
  )
}
