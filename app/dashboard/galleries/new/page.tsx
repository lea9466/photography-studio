import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchClients } from '@/lib/actions/client.actions'
import { GalleryBreadcrumb } from '@/components/dashboard/GalleryBreadcrumb'
import { GalleryWizard } from '@/components/gallery/GalleryWizard'
import { Button } from '@/components/ui/button'

export default async function NewGalleryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profileData }, clients] = await Promise.all([
    supabase.from('users').select('studio_name').eq('id', user.id).single(),
    fetchClients(),
  ])

  const studioName =
    (profileData as { studio_name: string | null } | null)?.studio_name ?? ''

  return (
    <div className="space-y-6">
      <GalleryBreadcrumb galleryTitle="גלריה חדשה" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">גלריה חדשה</h1>
          <p className="mt-1 text-sm text-[--muted]">
            3 שלבים — לקוח, סוג גלריה, פרסום
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/galleries">ביטול</Link>
        </Button>
      </div>

      <GalleryWizard clients={clients} defaultWatermarkText={studioName} />
    </div>
  )
}