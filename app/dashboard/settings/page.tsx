import { redirect } from 'next/navigation'

import { Settings2 } from 'lucide-react'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'

import { ProfileForm } from '@/components/dashboard/ProfileForm'
import { SiteLanguageSetting } from '@/components/dashboard/SiteLanguageSetting'
import { SiteVisibilitySetting } from '@/components/dashboard/SiteVisibilitySetting'
import { CustomDomainSetting } from '@/components/dashboard/CustomDomainSetting'
import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { isVercelConfigured, VERCEL_CNAME_TARGET } from '@/lib/vercel/config'
import type { CustomDomain } from '@/lib/types/database.types'

import { resolveBrandingPath, resolveBrandingPaths, padHeroUrlSlots } from '@/lib/branding-urls'



export default async function SettingsPage() {

  let context

  try {

    context = await requireDashboardContext()

  } catch {

    redirect('/login')

  }



  const { userId, supabase } = context

  const entitlements = await getStudioEntitlements(userId)

  const canConnectCustomDomain = entitlements.features.custom_domain
  const vercelReady = isVercelConfigured()

  // Fetch whenever Vercel is configured, regardless of current Pro status —
  // a photographer who connected a domain on Pro and later downgraded must
  // still be able to see and disconnect it from her dashboard, even though
  // she can no longer connect a NEW one (enforced server-side either way,
  // see assertFeatureAllowed in custom-domain.actions.ts).
  let customDomain: CustomDomain | null = null
  if (vercelReady) {
    const { data: domainRow } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    customDomain = (domainRow as CustomDomain | null) ?? null
  }

  // Shown if she can connect a new domain, OR already has one to manage —
  // never hides an existing connection just because she's no longer Pro.
  const showCustomDomainSection = vercelReady && (canConnectCustomDomain || customDomain !== null)

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

  const siteLanguage: SiteLanguage = resolveSiteLanguage(profile?.site_language)



  return (

    <div className="animate-fade-in">

      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">

        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">


          <div className="relative flex items-start gap-5">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">

              <Settings2 className="h-5 w-5" />

            </div>

            <div className="space-y-2">

              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">

                הגדרות אתר

              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">

                ניהול זהות המותג ותוכן האתר שלך — כל שינוי שתשמרי יתעדכן באתר הציבורי

              </p>

            </div>

          </div>

        </div>

        <SiteLanguageSetting key={siteLanguage} initialLanguage={siteLanguage} />

        <ProfileForm profile={profileWithUrls} isPro={entitlements.isPro} />

        <SiteVisibilitySetting
          key={Boolean(profile?.is_under_construction) ? 'hidden' : 'public'}
          initialUnderConstruction={Boolean(profile?.is_under_construction)}
        />

        {showCustomDomainSection && (
          <CustomDomainSetting
            key={customDomain?.id ?? 'none'}
            initialDomain={customDomain}
            cnameTarget={VERCEL_CNAME_TARGET}
            canConnect={canConnectCustomDomain}
          />
        )}

      </div>

    </div>

  )

}


