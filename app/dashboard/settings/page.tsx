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
    .select('name, studio_name, theme_primary')
    .eq('id', user.id)
    .single()

  const profile = data as {
    name: string | null
    studio_name: string | null
    theme_primary: string
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
