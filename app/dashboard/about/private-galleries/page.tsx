import { redirect } from 'next/navigation'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { AboutPage } from '@/components/dashboard/about/AboutKit'
import { PrivateGalleriesAboutContent } from '@/components/dashboard/about/PrivateGalleriesAboutContent'

export default async function PrivateGalleriesAboutPage() {
  try {
    await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  return (
    <AboutPage>
      <PrivateGalleriesAboutContent />
    </AboutPage>
  )
}
