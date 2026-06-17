import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/dashboard/ProfileForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('name, studio_name, theme_primary, about_text, stat_projects, stat_clients, stat_experience_years, accent_color, selected_theme, logo_url, hero_desktop_url, hero_mobile_url, about_image_url')
    .eq('id', user.id)
    .single()

  const profile = data as {
    name: string | null
    studio_name: string | null
    theme_primary: string
    about_text: string | null
    stat_projects: number
    stat_clients: number
    stat_experience_years: number
    accent_color: string
    selected_theme: string
    logo_url: string | null
    hero_desktop_url: string | null
    hero_mobile_url: string | null
    about_image_url: string | null
  } | null

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">הגדרות פרופיל</h1>
        <p className="mt-1 text-sm text-[--muted]">שם, סטודיו וצבע מותג</p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}
