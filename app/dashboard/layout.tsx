import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth.actions'
import { DashboardLayoutWrapper } from '@/components/dashboard/DashboardLayoutWrapper'
import type { User } from '@/lib/types/database.types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: any = null

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('name, studio_name, logo_url, accent_color, should_color_logo')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <DashboardLayoutWrapper
      userName={profile?.name || undefined}
      studioName={profile?.studio_name || undefined}
      logoUrl={profile?.logo_url || undefined}
      portfolioSlug={profile?.studio_name || null}
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
