import { redirect } from 'next/navigation'

import { Settings2 } from 'lucide-react'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'

import { ProfileForm } from '@/components/dashboard/ProfileForm'
import { SiteLanguageSetting } from '@/components/dashboard/SiteLanguageSetting'
import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

import { resolveBrandingPath, resolveBrandingPaths, padHeroUrlSlots } from '@/lib/branding-urls'



export default async function SettingsPage() {

  let context

  try {

    context = await requireDashboardContext()

  } catch {

    redirect('/login')

  }



  const { userId, supabase } = context

  const PROFILE_FIELDS =
    'name, studio_name, theme_primary, about_text, about_title, about_subtitle, about_description, contact_card_title, contact_card_description, address, phone, stat_projects, stat_clients, stat_experience_years, accent_color, selected_theme, logo_url, hero_desktop_url, hero_mobile_url, hero_desktop_urls, hero_mobile_urls, about_image_url, contact_desktop_url, contact_mobile_url, email, slug, should_color_logo, site_language'

  const PROFILE_FIELDS_LEGACY = PROFILE_FIELDS.replace(', site_language', '')

  let { data, error } = await supabase
    .from('users')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single()

  if (
    error &&
    (error.code === '42703' || error.code === 'PGRST204') &&
    error.message?.toLowerCase().includes('site_language')
  ) {
    ;({ data, error } = await supabase
      .from('users')
      .select(PROFILE_FIELDS_LEGACY)
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

    address: string | null

    phone: string | null

    stat_projects: number

    stat_clients: number

    stat_experience_years: number

    accent_color: string

    selected_theme: string

    logo_url: string | null

    hero_desktop_url: string | null

    hero_mobile_url: string | null

    hero_desktop_urls: string[] | null

    hero_mobile_urls: string[] | null

    about_image_url: string | null

    contact_desktop_url: string | null

    contact_mobile_url: string | null

    email: string | null

    slug: string | null

    should_color_logo: boolean

    site_language: string | null

  } | null



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

        <ProfileForm profile={profileWithUrls} />

      </div>

    </div>

  )

}


