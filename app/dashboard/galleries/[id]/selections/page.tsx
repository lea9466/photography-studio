import { notFound } from 'next/navigation'
import type { Gallery } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/server'
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'
import { fetchGallerySelections } from '@/lib/actions/photo.actions'
import { SelectionsView } from '@/components/dashboard/SelectionsView'
import { UploadEdited } from '@/components/gallery/UploadEdited'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type SelectionsPageProps = {
  params: Promise<{ id: string }>
}

export default async function GallerySelectionsPage({
  params,
}: SelectionsPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const gallery = (await fetchGalleryDetail(id)) as Gallery | null
  if (!gallery) notFound()

  const { albumPhotos, editPhotos } = await fetchGallerySelections(id)

  return (
    <div className="space-y-8 animate-fade-in">
      <SelectionsView
        galleryId={id}
        albumPhotos={albumPhotos}
        editPhotos={editPhotos}
      />

      {['editing', 'delivery_ready'].includes(gallery.status) ? (
        <Card>
          <CardHeader>
            <CardTitle>העלאת תמונות מעובדות</CardTitle>
            <CardDescription>
              גררי את כל התמונות המעובדות בבת אחת — הן ישויכו לבחירות הלקוח
              והתמונות הרגילות יוסתרו מהלקוח אוטומטית
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadEdited
              galleryId={id}
              userId={user.id}
              selectedPhotos={editPhotos}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
