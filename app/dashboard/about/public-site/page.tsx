import { redirect } from 'next/navigation'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { AboutPage } from '@/components/dashboard/about/AboutKit'
import { PublicSiteAboutContent } from '@/components/dashboard/about/PublicSiteAboutContent'

export default async function PublicSiteAboutPage() {
  try {
    await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  return (
    <AboutPage>
      <PublicSiteAboutContent />
    </AboutPage>
  )
}
