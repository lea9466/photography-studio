import { signOut } from '@/lib/actions/auth.actions'
import { DashboardLayoutWrapper } from '@/components/dashboard/DashboardLayoutWrapper'
import { getDashboardProfile } from '@/lib/queries/dashboard-profile'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getDashboardProfile()
  const portfolioSlug = profile?.slug?.trim() || null
  const welcomePreviewUrl = portfolioSlug ? `/${portfolioSlug}` : null

  return (
    <DashboardLayoutWrapper
      userName={profile?.name || undefined}
      studioName={profile?.studio_name || undefined}
      logoUrl={profile?.logo_url || undefined}
      portfolioSlug={portfolioSlug}
      showReferralPopup={profile?.show_referral_popup ?? false}
      showWelcomePopup={profile?.show_welcome_popup ?? false}
      welcomePreviewUrl={welcomePreviewUrl}
      accentColor={profile?.accent_color || undefined}
      shouldColorLogo={profile?.should_color_logo || false}
      onSignOut={async () => {
        'use server'
        await signOut()
      }}
    >
      {children}
    </DashboardLayoutWrapper>
  )
}
