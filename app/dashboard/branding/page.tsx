import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandingEditForm } from '@/components/dashboard/BrandingEditForm'
import { DashboardLayoutWrapper } from '@/components/dashboard/DashboardLayoutWrapper'

export default async function BrandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user branding data
  const { data: userData } = await supabase
    .from('users')
    .select(`
      studio_name,
      about_text,
      stat_projects,
      stat_clients,
      stat_experience_years,
      accent_color,
      selected_theme,
      hero_desktop_url,
      hero_mobile_url,
      about_image_url,
      name,
      logo_url
    `)
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/dashboard')
  }

  return (
    <DashboardLayoutWrapper
      userName={userData.name || undefined}
      studioName={userData.studio_name || undefined}
      logoUrl={userData.logo_url || undefined}
    >
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#100d1f] mb-2">הגדרות מותג</h1>
          <p className="text-gray-600">התאם אישית את דף הבית שלך עם הלוגו, הצבעים והתוכן שלך</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#c9c5cd] p-6 md:p-8">
          <BrandingEditForm
            branding={{
              studio_name: userData.studio_name,
              about_text: userData.about_text,
              stat_projects: userData.stat_projects || 0,
              stat_clients: userData.stat_clients || 0,
              stat_experience_years: userData.stat_experience_years || 0,
              accent_color: userData.accent_color || '#B8953F',
              selected_theme: userData.selected_theme || 'elegant',
              hero_desktop_url: userData.hero_desktop_url,
              hero_mobile_url: userData.hero_mobile_url,
              about_image_url: userData.about_image_url,
            }}
          />
        </div>

        <div className="mt-8 p-6 bg-[#f7f2f4] rounded-xl border border-[#c9c5cd]">
          <h3 className="font-semibold text-[#100d1f] mb-3">כיצד נראה דף הבית שלך?</h3>
          <p className="text-sm text-gray-600 mb-4">
            לאחר שמירת ההגדרות, דף הבית האישי שלך יהיה זמין בכתובת:
          </p>
          <div className="bg-white p-4 rounded-lg border border-[#c9c5cd]">
            <code className="text-sm text-[#6b2d43]">
              {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/{userData.studio_name || 'your-studio-name'}
            </code>
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  )
}
