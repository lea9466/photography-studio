import { signOut } from '@/lib/actions/auth.actions'
import { getDashboardContext } from '@/lib/auth/dashboard-context'
import { DashboardLayoutWrapper } from '@/components/dashboard/DashboardLayoutWrapper'
import { getDashboardProfile } from '@/lib/queries/dashboard-profile'
import { getActiveAnnouncement } from '@/lib/queries/announcement'

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
  const portfolioSlug = profile?.slug?.trim() || null
  const welcomePreviewUrl = portfolioSlug ? `/${portfolioSlug}` : null
  const isImpersonating = context?.isImpersonating ?? false

  return (
    <DashboardLayoutWrapper
      userName={profile?.name || undefined}
      studioName={profile?.studio_name || undefined}
      logoUrl={profile?.logo_url || undefined}
      portfolioSlug={portfolioSlug}
      showReferralPopup={isImpersonating ? false : (profile?.show_referral_popup ?? false)}
      showWelcomePopup={isImpersonating ? false : (profile?.show_welcome_popup ?? false)}
      welcomePreviewUrl={welcomePreviewUrl}
      accentColor={profile?.accent_color || undefined}
      shouldColorLogo={profile?.should_color_logo || false}
      isImpersonating={isImpersonating}
      announcement={isImpersonating ? null : announcement}
      onSignOut={async () => {
        'use server'
        await signOut()
      }}
    >
      {children}
    </DashboardLayoutWrapper>
  )
}
