import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchClients } from '@/lib/actions/client.actions'
import { getPublicGalleryQuota } from '@/lib/actions/gallery.actions'
import { GalleryBreadcrumb } from '@/components/dashboard/GalleryBreadcrumb'
import { GalleryWizard } from '@/components/gallery/GalleryWizard'
import { Button } from '@/components/ui/button'
import {
  MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER,
  MAX_PUBLIC_GALLERY_PHOTOS,
} from '@/lib/types/app.types'

export default async function NewGalleryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profileData }, clients, quota] = await Promise.all([
    supabase.from('users').select('studio_name').eq('id', user.id).single(),
    fetchClients(),
    getPublicGalleryQuota(),
  ])

  const studioName =
    (profileData as { studio_name: string | null } | null)?.studio_name ?? ''

  const canCreateGallery = quota?.canCreateGallery ?? true

  return (
    <div className="space-y-6">
      <GalleryBreadcrumb galleryTitle="גלריה חדשה" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">גלריה חדשה</h1>
          <p className="mt-1 text-sm text-[--muted]">
            {canCreateGallery
              ? `${quota?.galleryCount ?? 0} מתוך ${MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER} גלריות · עד ${MAX_PUBLIC_GALLERY_PHOTOS} תמונות בכל גלריה`
              : `הגעת למקסימום ${MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER} גלריות`}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/galleries">ביטול</Link>
        </Button>
      </div>

      {canCreateGallery ? (
        <GalleryWizard clients={clients} defaultWatermarkText={studioName} />
      ) : (
        <div className="rounded-xl border border-[#c9c5cd] bg-white p-8 text-center">
          <p className="text-[#48464c]">
            ניתן ליצור עד {MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER} גלריות, עם עד {MAX_PUBLIC_GALLERY_PHOTOS} תמונות בכל גלריה.
            מחקי גלריה קיימת כדי ליצור חדשה.
          </p>
          <Button asChild className="mt-6 bg-[#7D3A52] text-white hover:bg-[#6a2f44]">
            <Link href="/dashboard/galleries">חזרה לגלריות</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
