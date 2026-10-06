import type { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { resolveBrandingPath, resolveBrandingPaths, padHeroUrlSlots } from '@/lib/branding-urls'

/**
 * Loads the studio-owner's profile row with all branding image paths resolved
 * to URLs. Shared by the dashboard pages that edit it (הגדרות אתר, סקשן ראשי,
 * סקשן אודות) — each renders a different slice of the same ProfileForm.
 * Falls back to narrower column lists when a migration hasn't been applied yet.
 */
export async function loadSiteProfile(supabase: Awaited<ReturnType<typeof requireDashboardContext>>['supabase'], userId: string) {
  const PROFILE_FIELDS =
    'name, studio_name, theme_primary, about_text, about_title, about_subtitle, about_description, contact_card_title, contact_card_description, contact_title, contact_subtitle, address, phone, stat_projects, stat_clients, stat_experience_years, accent_color, selected_theme, heading_font, about_title_font, logo_url, hero_desktop_url, hero_mobile_url, hero_desktop_urls, hero_mobile_urls, hero_type, hero_video_url, about_image_url, contact_desktop_url, contact_mobile_url, email, slug, should_color_logo, site_language, is_under_construction'
  const PROFILE_FIELDS_NO_VISIBILITY = PROFILE_FIELDS.replace(', is_under_construction', '')
  const PROFILE_FIELDS_NO_HERO_VIDEO = PROFILE_FIELDS_NO_VISIBILITY.replace(
    ', hero_type, hero_video_url',
    ''
  )
  const PROFILE_FIELDS_NO_FONTS = PROFILE_FIELDS_NO_HERO_VIDEO.replace(', heading_font, about_title_font', '')
  const PROFILE_FIELDS_NO_LANGUAGE = PROFILE_FIELDS_NO_FONTS.replace(', site_language', '')
  const PROFILE_FIELDS_NO_CONTACT_HEADINGS = PROFILE_FIELDS_NO_LANGUAGE.replace(
    ', contact_title, contact_subtitle',
    ''
  )
  let { data, error } = await supabase
    .from('users')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single()
  function isMissingColumnError(err: typeof error | null) {
    return !!err && (err.code === '42703' || err.code === 'PGRST204')
  }
  if (
    isMissingColumnError(error) &&
    error?.message?.toLowerCase().includes('is_under_construction')
  ) {
    ;({ data, error } = await supabase
      .from('users')
      .select(PROFILE_FIELDS_NO_VISIBILITY)
      .eq('id', userId)
      .single())
  }
  if (
    isMissingColumnError(error) &&
    (error?.message?.toLowerCase().includes('hero_type') ||
      error?.message?.toLowerCase().includes('hero_video_url'))
  ) {
    ;({ data, error } = await supabase
      .from('users')
      .select(PROFILE_FIELDS_NO_HERO_VIDEO)
      .eq('id', userId)
      .single())
  }
  if (
    isMissingColumnError(error) &&
    (error?.message?.toLowerCase().includes('heading_font') ||
      error?.message?.toLowerCase().includes('about_title_font'))
  ) {
    ;({ data, error } = await supabase
      .from('users')
      .select(PROFILE_FIELDS_NO_FONTS)
      .eq('id', userId)
      .single())
  }
  if (isMissingColumnError(error) && error?.message?.toLowerCase().includes('site_language')) {
    ;({ data, error } = await supabase
      .from('users')
      .select(PROFILE_FIELDS_NO_LANGUAGE)
      .eq('id', userId)
      .single())
  }
  if (
    isMissingColumnError(error) &&
    (error?.message?.toLowerCase().includes('contact_title') ||
      error?.message?.toLowerCase().includes('contact_subtitle'))
  ) {
    ;({ data, error } = await supabase
      .from('users')
      .select(PROFILE_FIELDS_NO_CONTACT_HEADINGS)
      .eq('id', userId)
      .single())
  }
  if (error) {
    console.error('[SettingsPage] failed to load profile:', error.message)
  }
  async function resolveBrandingUrl(pathOrUrl: string | null) {
    return resolveBrandingPath(pathOrUrl)
  }
  const profile = data as {
    name: string | null
    studio_name: string | null
    theme_primary: string
    about_text: string | null
    about_title: string | null
    about_subtitle: string | null
    about_description: string | null
    contact_card_title: string | null
    contact_card_description: string | null
    contact_title: string | null
    contact_subtitle: string | null
    address: string | null
    phone: string | null
    stat_projects: number
    stat_clients: number
    stat_experience_years: number
    accent_color: string
    selected_theme: string
    heading_font: string | null
    about_title_font: string | null
    logo_url: string | null
    hero_desktop_url: string | null
    hero_mobile_url: string | null
    hero_desktop_urls: string[] | null
    hero_mobile_urls: string[] | null
    hero_type?: 'images' | 'video' | null
    hero_video_url?: string | null
    about_image_url: string | null
    contact_desktop_url: string | null
    contact_mobile_url: string | null
    email: string | null
    slug: string | null
    should_color_logo: boolean
    site_language: string | null
    is_under_construction?: boolean | null
  } | null
  const resolvedHeroType: 'images' | 'video' =
    profile?.hero_type === 'video' ? 'video' : 'images'
  const profileWithUrls = profile ? {
    ...profile,
    logo_url: await resolveBrandingUrl(profile.logo_url),
    hero_desktop_url: await resolveBrandingUrl(profile.hero_desktop_url),
    hero_mobile_url: await resolveBrandingUrl(profile.hero_mobile_url),
    hero_desktop_urls: padHeroUrlSlots(
      await resolveBrandingPaths(
        profile.hero_desktop_urls?.length
          ? profile.hero_desktop_urls
          : profile.hero_desktop_url
            ? [profile.hero_desktop_url]
            : []
      )
    ),
    hero_mobile_urls: padHeroUrlSlots(
      await resolveBrandingPaths(
        profile.hero_mobile_urls?.length
          ? profile.hero_mobile_urls
          : profile.hero_mobile_url
            ? [profile.hero_mobile_url]
            : []
      )
    ),
    hero_type: resolvedHeroType,
    hero_video_url: await resolveBrandingUrl(profile.hero_video_url ?? null),
    about_image_url: await resolveBrandingUrl(profile.about_image_url),
    contact_desktop_url: await resolveBrandingUrl(profile.contact_desktop_url),
    contact_mobile_url: await resolveBrandingUrl(profile.contact_mobile_url),
  } : null
  return profileWithUrls
}
