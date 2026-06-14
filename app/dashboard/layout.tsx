import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth.actions'
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

  let profile: Pick<User, 'name' | 'studio_name'> | null = null
  let portfolioSlug: string | null = null

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('name, studio_name')
      .eq('id', user.id)
      .single()
    profile = data as Pick<User, 'name' | 'studio_name'> | null

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
      <header className="border-b border-[--border]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-semibold">
              {profile?.studio_name ?? 'Studio Gallery'}
            </p>
            <p className="text-sm text-[--muted]">
              {profile?.name ?? user?.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {portfolioSlug ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/portfolio/${portfolioSlug}`} target="_blank">
                  דף ציבורי
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">גלריות</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">הגדרות</Link>
            </Button>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                יציאה
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
