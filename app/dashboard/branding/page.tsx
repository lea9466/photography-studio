import { redirect } from 'next/navigation'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { BrandingEditForm } from '@/components/dashboard/BrandingEditForm'
import { DashboardLayoutWrapper } from '@/components/dashboard/DashboardLayoutWrapper'
import { MVP_DEFAULT_DASHBOARD_PATH } from '@/lib/types/app.types'
import type { User } from '@/lib/types/database.types'

export default async function BrandingPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

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
      heading_font,
      about_title_font,
      hero_desktop_url,
      hero_mobile_url,
      about_image_url,
      name,
      logo_url
    `)
    .eq('id', userId)
    .single()

  const typedUserData = userData as User | null

  if (!typedUserData) {
    redirect(MVP_DEFAULT_DASHBOARD_PATH)
  }

  return (
    <DashboardLayoutWrapper
      userName={typedUserData.name || undefined}
      studioName={typedUserData.studio_name || undefined}
      logoUrl={typedUserData.logo_url || undefined}
    >
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#100d1f] mb-2">הגדרות מותג</h1>
          <p className="text-gray-600">התאם אישית את דף הבית שלך עם הלוגו, הצבעים והתוכן שלך</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#c9c5cd] p-6 md:p-8">
          <BrandingEditForm
            branding={{
              studio_name: typedUserData.studio_name,
              about_text: typedUserData.about_text,
              stat_projects: typedUserData.stat_projects || 0,
              stat_clients: typedUserData.stat_clients || 0,
              stat_experience_years: typedUserData.stat_experience_years || 0,
              accent_color: typedUserData.accent_color || '#B8953F',
              selected_theme: typedUserData.selected_theme || 'elegant',
              heading_font: typedUserData.heading_font,
              about_title_font: typedUserData.about_title_font,
              hero_desktop_url: typedUserData.hero_desktop_url,
              hero_mobile_url: typedUserData.hero_mobile_url,
              about_image_url: typedUserData.about_image_url,
              should_color_logo: false,
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
              {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/{typedUserData.studio_name || 'your-studio-name'}
            </code>
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  )
}
