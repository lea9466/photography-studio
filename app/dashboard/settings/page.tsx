import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/dashboard/ProfileForm'
import { resolveMediaUrl } from '@/lib/r2/storage'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('name, studio_name, theme_primary, about_text, about_title, about_subtitle, about_description, contact_card_title, contact_card_description, stat_projects, stat_clients, stat_experience_years, accent_color, selected_theme, logo_url, hero_desktop_url, hero_mobile_url, about_image_url, email, slug, should_color_logo')
    .eq('id', user.id)
    .single()

  async function resolveBrandingUrl(pathOrUrl: string | null) {
    if (!pathOrUrl) return null
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl
    }
    return resolveMediaUrl('branding', pathOrUrl)
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
    stat_projects: number
    stat_clients: number
    stat_experience_years: number
    accent_color: string
    selected_theme: string
    logo_url: string | null
    hero_desktop_url: string | null
    hero_mobile_url: string | null
    about_image_url: string | null
    email: string | null
    slug: string | null
    should_color_logo: boolean
  } | null

  const profileWithUrls = profile ? {
    ...profile,
    logo_url: await resolveBrandingUrl(profile.logo_url),
    hero_desktop_url: await resolveBrandingUrl(profile.hero_desktop_url),
    hero_mobile_url: await resolveBrandingUrl(profile.hero_mobile_url),
    about_image_url: await resolveBrandingUrl(profile.about_image_url),
  } : null

  return (
    <div className="animate-fade-in">
      <div className="p-6 md:p-10 space-y-10 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[--foreground] tracking-tight">הגדרות אתר</h1>
          <p className="mt-1 text-sm text-[--muted]">ניהול זהות המותג ותוכן האתר שלך</p>
        </div>
        <ProfileForm profile={profileWithUrls} />
      </div>
    </div>
  )
}
