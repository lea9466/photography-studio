import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchPackages } from '@/lib/actions/package.actions'
import { PackagesManager } from '@/components/dashboard/PackagesManager'

export default async function PackagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [packages, profileResult] = await Promise.all([
    fetchPackages(),
    supabase
      .from('users')
      .select('packages_title, packages_subtitle, selected_theme')
      .eq('id', user.id)
      .single(),
  ])

  const profile = profileResult.data as {
    packages_title: string | null
    packages_subtitle: string | null
    selected_theme: string | null
  } | null

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">חבילות צילום</h1>
        <p className="mt-1 text-sm text-[--muted]">
          הגדירי חבילות עם מחיר ורשימת &quot;מה כלול&quot;. רק חבילות פעילות מוצגות בדף הבית — אם אין חבילות פעילות, סקשן החבילות לא יופיע באתר. מומלץ להגדיר בדיוק 3 חבילות פעילות לתצוגה מיטבית.
        </p>
      </div>
      <PackagesManager
        initialPackages={packages}
        initialSectionTitle={profile?.packages_title ?? null}
        initialSectionSubtitle={profile?.packages_subtitle ?? null}
        selectedTheme={profile?.selected_theme ?? 'elegant'}
      />
    </div>
  )
}
