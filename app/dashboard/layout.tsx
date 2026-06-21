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

  let profile: Pick<User, 'name' | 'studio_name' | 'logo_url'> | null = null
  let portfolioSlug: string | null = null

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('name, studio_name, logo_url')
      .eq('id', user.id)
      .single()
    profile = data as Pick<User, 'name' | 'studio_name' | 'logo_url'> | null

    const { data: portfolio } = await supabase
      .from('galleries')
      .select('slug')
      .eq('user_id', user.id)
      .eq('gallery_type', 'portfolio')
      .not('slug', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    portfolioSlug = (portfolio as { slug: string | null } | null)?.slug ?? null
  }

  return (
    <DashboardLayoutWrapper
      userName={profile?.name || undefined}
      studioName={profile?.studio_name || undefined}
      logoUrl={profile?.logo_url || undefined}
      portfolioSlug={portfolioSlug}
      onSignOut={async () => {
        'use server'
        await signOut()
      }}
    >
      {children}
    </DashboardLayoutWrapper>
  )
}
