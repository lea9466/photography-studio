import { getDashboardContext } from '@/lib/auth/dashboard-context'
import { resolveBrandingPath } from '@/lib/branding-urls'

export type SiteOnboardingState = {
  /** Modal should open on this dashboard entry. */
  shouldShow: boolean
  studioName: string
  slug: string | null
  accentColor: string | null
  aboutText: string
  selectedTheme: string
  logoUrl: string | null
  /** Resolved (signed) URL of the existing first hero image, if any. */
  heroPreviewUrl: string | null
}

type OnboardingRow = {
  studio_name: string | null
  slug: string | null
  accent_color: string | null
  about_text: string | null
  selected_theme: string | null
  logo_url: string | null
  hero_desktop_url: string | null
  hero_desktop_urls: string[] | null
  show_welcome_popup: boolean | null
  site_onboarding_skipped?: boolean | null
}

const BASE_COLUMNS =
  'studio_name, slug, accent_color, about_text, selected_theme, logo_url, hero_desktop_url, hero_desktop_urls, show_welcome_popup'

/**
 * Opens on the very first entry, and then on every entry while the studio
 * still has no slug — unless she chose "galleries only".
 * `site_onboarding_skipped` may not exist yet (migration pending), so the
 * query falls back to the base columns instead of failing the whole layout.
 */
export async function getSiteOnboardingState(): Promise<SiteOnboardingState | null> {
  const context = await getDashboardContext()
  if (!context) return null
  const { supabase, userId } = context

  let row: OnboardingRow | null = null
  const withSkip = await supabase
    .from('users')
    .select(`${BASE_COLUMNS}, site_onboarding_skipped`)
    .eq('id', userId)
    .maybeSingle()

  if (!withSkip.error) {
    row = withSkip.data as OnboardingRow | null
  } else {
    const base = await supabase.from('users').select(BASE_COLUMNS).eq('id', userId).maybeSingle()
    row = base.error ? null : (base.data as OnboardingRow | null)
  }
  if (!row) return null

  const heroPath =
    row.hero_desktop_urls?.find((url) => url?.trim()) || row.hero_desktop_url?.trim() || null
  const slug = row.slug?.trim() || null
  const skipped = Boolean(row.site_onboarding_skipped)
  const firstEntry = Boolean(row.show_welcome_popup)
  // The hero image is optional, so only a missing slug keeps re-opening the modal.
  const missingBasics = !slug

  const [heroPreviewUrl, logoUrl] = await Promise.all([
    heroPath ? resolveBrandingPath(heroPath) : Promise.resolve(null),
    row.logo_url ? resolveBrandingPath(row.logo_url) : Promise.resolve(null),
  ])

  return {
    shouldShow: firstEntry || (missingBasics && !skipped),
    studioName: row.studio_name?.trim() ?? '',
    slug,
    accentColor: row.accent_color,
    aboutText: row.about_text ?? '',
    selectedTheme: row.selected_theme || 'classic',
    logoUrl,
    heroPreviewUrl,
  }
}
