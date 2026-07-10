import { redirect } from 'next/navigation'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { fetchPackages } from '@/lib/actions/package.actions'
import { PackagesManager } from '@/components/dashboard/PackagesManager'

export default async function PackagesPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

  const [packages, profileResult] = await Promise.all([
    fetchPackages(),
    supabase
      .from('users')
      .select('packages_title, packages_subtitle, selected_theme')
      .eq('id', userId)
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
