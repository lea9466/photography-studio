import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth.actions'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav'
import { MobileHeader } from '@/components/dashboard/MobileHeader'
import { Button } from '@/components/ui/button'
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
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <SidebarNav 
        userName={profile?.name || undefined}
        studioName={profile?.studio_name || undefined}
        logoUrl={profile?.logo_url || undefined}
        onSignOut={async () => {
          'use server'
          await signOut()
        }}
      />
      
      {/* Mobile Header */}
      <MobileHeader studioName={profile?.studio_name || undefined} />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Main Content */}
      <main className="md:mr-72 p-4 md:p-10 min-h-screen pt-20 md:pt-10 pb-24 md:pb-10">
        {children}
      </main>
    </div>
  )
}
