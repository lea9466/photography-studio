import { redirect } from 'next/navigation'

import { Sparkles } from 'lucide-react'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'

import { SiteHeroSections } from '@/components/dashboard/hero-design/SiteHeroSections'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { loadSiteProfile } from '@/lib/queries/site-profile'
import { getPublicSitePath } from '@/lib/queries/public-photographer'
import { fetchHeroOptionTiers } from '@/lib/public-site/hero-option-tiers'
import { normalizeHeroSettings } from '@/lib/public-site/hero-settings'
import { THEME_OPTIONS } from '@/lib/dashboard/site-settings-help'

export default async function SiteHeroSectionPage() {
  let context

  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

  const [entitlements, profile, heroOptionTiers, heroSettingsRow] = await Promise.all([
    getStudioEntitlements(userId),
    loadSiteProfile(supabase, userId),
    fetchHeroOptionTiers(),
    supabase.from('users').select('hero_settings').eq('id', userId).single(),
  ])

  // Column not migrated yet -> behave as "theme hero".
  const heroSettings = normalizeHeroSettings(
    (heroSettingsRow.data as { hero_settings?: unknown } | null)?.hero_settings
  )
  const themeName =
    THEME_OPTIONS.find((theme) => theme.id === (profile?.selected_theme === 'dark' ? 'bold' : profile?.selected_theme))
      ?.name ?? 'הנוכחית'

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-(--border) bg-(--dashboard-surface) px-7 py-6 md:px-9 md:py-7">
          <div className="relative flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-(--foreground) md:text-[1.65rem]">
                סקשן ראשי
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-(--muted)">
                התמונות או הסרטון שמופיעים בראש דף הבית — הדבר הראשון שהמבקרים רואים. כל שינוי שתשמרי יתעדכן באתר הציבורי.
              </p>
            </div>
          </div>
        </div>

        <SiteHeroSections
          profileFormProps={{ profile, isPro: entitlements.isPro }}
          heroEditorProps={{
            initialSettings: heroSettings,
            tiers: heroOptionTiers,
            isPro: entitlements.isPro,
            themeName,
            sitePath: profile ? getPublicSitePath(profile.slug, profile.studio_name) : null,
          }}
        />
      </div>
    </div>
  )
}
