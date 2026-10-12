import { Settings, Trash2, Upload } from 'lucide-react'
import { fetchGalleryPhotos } from '@/lib/actions/photo.actions'
import { resolveWatermarkText } from '@/lib/images/process'
import { signStoragePaths } from '@/lib/storage'
import { isPhotoLimitTestUser } from '@/lib/gallery-photo-limits'
import type { Gallery, GallerySettings } from '@/lib/types/database.types'
import { GalleryPhotosSection } from '@/components/gallery/GalleryPhotosSection'
import { ShowcaseGalleryEditForm } from '@/components/dashboard/ShowcaseGalleryEditForm'
import { CollapsibleSection } from '@/components/dashboard/CollapsibleSection'
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
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      {/* Same folded-card pattern as the private gallery view; photos last. */}
      <div className="grid items-start gap-4 md:grid-cols-2">
      <CollapsibleSection
        tone="violet"
        icon={<Settings className="h-5 w-5" />}
        title="הגדרות הגלריה"
        summary={[
          gallery.title,
          settings?.auto_apply_watermark === false ? 'ללא סימן מים' : 'סימן מים פעיל',
        ].join(' · ')}
      >
        <ShowcaseGalleryEditForm
          gallery={{
            id: gallery.id,
            title: gallery.title,
            cover_image: gallery.cover_image,
          }}
          settings={settings}
        />
      </CollapsibleSection>

      <CollapsibleSection
        tone="red"
        icon={<Trash2 className="h-5 w-5" />}
        title="מחיקת גלריה"
        summary="מוחקת את הגלריה וכל התמונות — פעולה בלתי הפיכה"
      >
        <DeleteGalleryButton galleryId={gallery.id} galleryTitle={gallery.title} />
      </CollapsibleSection>
      </div>

      <CollapsibleSection
        tone="burgundy"
        icon={<Upload className="h-5 w-5" />}
        title="תמונות"
        summary={`${photos.length} תמונות`}
        defaultOpen
      >
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
      </CollapsibleSection>
    </div>
  )
}
