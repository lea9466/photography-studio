import { redirect } from 'next/navigation'

import { Settings2 } from 'lucide-react'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'

import { ProfileForm } from '@/components/dashboard/ProfileForm'
import { SiteLanguageSetting } from '@/components/dashboard/SiteLanguageSetting'
import { SiteVisibilitySetting } from '@/components/dashboard/SiteVisibilitySetting'
import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { loadSiteProfile } from '@/lib/queries/site-profile'

export default async function SettingsPage() {
  let context

  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

  const [entitlements, profile] = await Promise.all([
    getStudioEntitlements(userId),
    loadSiteProfile(supabase, userId),
  ])

  const siteLanguage: SiteLanguage = resolveSiteLanguage(profile?.site_language)

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-(--border) bg-(--dashboard-surface) px-7 py-6 md:px-9 md:py-7">
          <div className="relative flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <Settings2 className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-(--foreground) md:text-[1.65rem]">
                הגדרות אתר
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-(--muted)">
                פרטי העסק, מיתוג ועיצוב, יצירת קשר והגדרות כלליות. את הסקשן הראשי ואת סקשן האודות
                מנהלים בטאבים נפרדים.
              </p>
            </div>
          </div>
        </div>

        <SiteLanguageSetting key={siteLanguage} initialLanguage={siteLanguage} />

        <ProfileForm view="settings" profile={profile} isPro={entitlements.isPro} />

        <SiteVisibilitySetting
          key={Boolean(profile?.is_under_construction) ? 'hidden' : 'public'}
          initialUnderConstruction={Boolean(profile?.is_under_construction)}
        />
      </div>
    </div>
  )
}
