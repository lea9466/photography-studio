import { notFound } from 'next/navigation'
import type { Gallery } from '@/lib/types/database.types'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'
import { fetchGallerySelections } from '@/lib/actions/photo.actions'
import { SelectionsView } from '@/components/dashboard/SelectionsView'
import { UploadEdited } from '@/components/gallery/UploadEdited'
import { Card, CardContent } from '@/components/ui/card'

type SelectionsPageProps = {
  params: Promise<{ id: string }>
}

export default async function GallerySelectionsPage({
  params,
}: SelectionsPageProps) {
  const { id } = await params
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    notFound()
  }

  const { userId } = context

  const gallery = (await fetchGalleryDetail(id)) as Gallery | null
  if (!gallery) notFound()

  const { albumPhotos, editPhotos } = await fetchGallerySelections(id)

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">בחירות הלקוח</h2>
          <p className="text-sm text-[--muted]">
            תמונות שנבחרו לאלבום ולעיבוד
          </p>
        </div>
        <SelectionsView
          galleryId={id}
          albumPhotos={albumPhotos}
          editPhotos={editPhotos}
        />
      </section>

      {['editing', 'delivery_ready'].includes(gallery.status) ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-medium">העלאת תמונות מעובדות</h2>
            <p className="text-sm text-[--muted]">
              גררי את כל התמונות המעובדות — הן ישויכו לבחירות הלקוח
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <UploadEdited
                galleryId={id}
                userId={userId}
                selectedPhotos={editPhotos}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
