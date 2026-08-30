import { Settings, Upload } from 'lucide-react'
import { fetchGalleryPhotos } from '@/lib/actions/photo.actions'
import { resolveWatermarkText } from '@/lib/images/process'
import { signStoragePaths } from '@/lib/storage'
import { isPhotoLimitTestUser } from '@/lib/gallery-photo-limits'
import type { Gallery, GallerySettings } from '@/lib/types/database.types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GalleryPhotosSection } from '@/components/gallery/GalleryPhotosSection'
import { ShowcaseGalleryEditForm } from '@/components/dashboard/ShowcaseGalleryEditForm'
import { DeleteGalleryButton } from '@/components/dashboard/DeleteGalleryButton'

type ShowcaseGalleryDetailProps = {
  gallery: Gallery
  settings: GallerySettings | null
  userId: string
  studioName: string | null
}

/**
 * Manage view for a public showcase gallery — only what a showcase gallery has:
 * settings (title / cover / watermark), photo upload, delete. No client card,
 * no access link, no selections, no send-to-client actions.
 */
export async function ShowcaseGalleryDetail({
  gallery,
  settings,
  userId,
  studioName,
}: ShowcaseGalleryDetailProps) {
  const photos = await fetchGalleryPhotos(gallery.id)
  const signedUrls = await signStoragePaths(
    'previews',
    photos.map((p) => (p as { preview_url: string | null }).preview_url)
  )

  return (
    <div className="animate-fade-in space-y-8 sm:space-y-12">
      <section className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#100d1f] sm:text-xl">
            <Settings className="h-5 w-5" />
            הגדרות
          </h2>
          <p className="text-sm text-[#48464c]">שם הגלריה, תמונת שער וסימן מים</p>
        </div>
        <Card className="border-[#c9c5cd] shadow-sm">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-[#100d1f]">עריכת הגדרות</CardTitle>
            <CardDescription className="text-[#48464c]">
              שינויים נשמרים בלחיצה על &quot;שמור הגדרות&quot;
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ShowcaseGalleryEditForm
              gallery={{
                id: gallery.id,
                title: gallery.title,
                cover_image: gallery.cover_image,
              }}
              settings={settings}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#100d1f] sm:text-xl">
            <Upload className="h-5 w-5" />
            העלאה וניהול
          </h2>
          <p className="text-sm text-[#48464c]">העלאת תמונות חדשות לגלריה</p>
        </div>
        <GalleryPhotosSection
          galleryId={gallery.id}
          userId={userId}
          watermarkText={resolveWatermarkText(settings?.watermark_text, studioName)}
          applyAutoWatermark={settings?.auto_apply_watermark ?? true}
          photos={photos as never}
          signedUrls={signedUrls}
          showWizardHeader={false}
          initialPhotoLimit={20}
          publicOnlyMvp
          photoCountLimitBypassed={isPhotoLimitTestUser(userId)}
          storeOriginalPhotos={false}
        />
      </section>

      <section className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[#100d1f] sm:text-xl">מחיקת גלריה</h2>
          <p className="text-sm text-[#48464c]">מחיקת הגלריה וכל התמונות שבה — פעולה בלתי הפיכה</p>
        </div>
        <DeleteGalleryButton galleryId={gallery.id} galleryTitle={gallery.title} />
      </section>
    </div>
  )
}
