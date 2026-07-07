import { signOut } from '@/lib/actions/auth.actions'
import { DashboardLayoutWrapper } from '@/components/dashboard/DashboardLayoutWrapper'
import { getDashboardProfile } from '@/lib/queries/dashboard-profile'
import { getPublicSitePath } from '@/lib/queries/public-photographer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getDashboardProfile()
  const sitePath = profile
    ? getPublicSitePath(profile.slug, profile.studio_name)
    : null

  return (
    <DashboardLayoutWrapper
      userName={profile?.name || undefined}
      studioName={profile?.studio_name || undefined}
      logoUrl={profile?.logo_url || undefined}
      portfolioSlug={sitePath ? sitePath.replace(/^\//, '') : null}
      showReferralPopup={profile?.show_referral_popup ?? false}
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
