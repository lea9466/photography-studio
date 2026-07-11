import { redirect } from 'next/navigation'
import { Camera } from 'lucide-react'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { fetchPackages } from '@/lib/actions/package.actions'
import { PackagesManager } from '@/components/dashboard/PackagesManager'
import { resolveBrandingPath } from '@/lib/branding-urls'

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
      .select('packages_title, packages_subtitle, selected_theme, packages_desktop_url, packages_mobile_url')
      .eq('id', userId)
      .single(),
  ])

  const profile = profileResult.data as {
    packages_title: string | null
    packages_subtitle: string | null
    selected_theme: string | null
    packages_desktop_url: string | null
    packages_mobile_url: string | null
  } | null

  const [packagesDesktopUrl, packagesMobileUrl] = await Promise.all([
    resolveBrandingPath(profile?.packages_desktop_url ?? null),
    resolveBrandingPath(profile?.packages_mobile_url ?? null),
  ])

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <Camera className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                חבילות צילום
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                הגדירי חבילות עם מחיר ורשימת &quot;מה כלול&quot;. רק חבילות פעילות מוצגות בדף הבית — מומלץ להגדיר בדיוק 3 חבילות פעילות לתצוגה מיטבית.
              </p>
            </div>
          </div>
        </div>
        <PackagesManager
          initialPackages={packages}
          initialSectionTitle={profile?.packages_title ?? null}
          initialSectionSubtitle={profile?.packages_subtitle ?? null}
          selectedTheme={profile?.selected_theme ?? 'elegant'}
          initialPackagesDesktopUrl={packagesDesktopUrl}
          initialPackagesMobileUrl={packagesMobileUrl}
        />
      </div>
    </div>
  )
}
