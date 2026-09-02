import { signOut } from '@/lib/actions/auth.actions'
import { getDashboardContext } from '@/lib/auth/dashboard-context'
import { DashboardLayoutWrapper } from '@/components/dashboard/DashboardLayoutWrapper'
import { getDashboardProfile } from '@/lib/queries/dashboard-profile'
import { getActiveAnnouncement } from '@/lib/queries/announcement'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { getAssistantMissingFlags, hasAnyMissingContent } from '@/lib/assistant/studio-context'
import { CLIENT_GALLERIES_ENABLED } from '@/lib/types/app.types'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, context, announcement] = await Promise.all([
    getDashboardProfile(),
    getDashboardContext(),
    getActiveAnnouncement(),
  ])
  const entitlements = context ? await getStudioEntitlements(context.userId) : null
  const portfolioSlug = profile?.slug?.trim() || null
  const welcomePreviewUrl = portfolioSlug ? `/${portfolioSlug}` : null
  const isImpersonating = context?.isImpersonating ?? false
  const siteUnavailableLocked =
    !isImpersonating && Boolean(profile?.is_site_unavailable)
  const assistantMissing = context
    ? await getAssistantMissingFlags(context.userId, context.supabase)
    : null
  const canCreateClientGalleries = CLIENT_GALLERIES_ENABLED

  return (
    <DashboardLayoutWrapper
      userName={profile?.name || undefined}
      studioName={profile?.studio_name || undefined}
      logoUrl={profile?.logo_url || undefined}
      portfolioSlug={portfolioSlug}
      showReferralPopup={
        isImpersonating || siteUnavailableLocked
          ? false
          : (profile?.show_referral_popup ?? false)
      }
      showWelcomePopup={
        isImpersonating || siteUnavailableLocked
          ? false
          : (profile?.show_welcome_popup ?? false)
      }
      welcomePreviewUrl={welcomePreviewUrl}
      accentColor={profile?.accent_color || undefined}
      shouldColorLogo={profile?.should_color_logo || false}
      isImpersonating={isImpersonating}
      siteUnavailableLocked={siteUnavailableLocked}
      isPro={entitlements?.isPro ?? true}
      canUseCustomDomain={entitlements?.features.custom_domain ?? true}
      canCreateClientGalleries={canCreateClientGalleries}
      isUnderConstruction={Boolean(profile?.is_under_construction)}
      announcement={isImpersonating || siteUnavailableLocked ? null : announcement}
      assistantHasMissingContent={assistantMissing ? hasAnyMissingContent(assistantMissing) : false}
      assistantMissingSlug={!portfolioSlug}
      onSignOut={async () => {
        'use server'
        await signOut()
      }}
    >
      {children}
    </DashboardLayoutWrapper>
  )
}
