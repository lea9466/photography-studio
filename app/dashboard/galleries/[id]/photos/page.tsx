import { notFound } from 'next/navigation'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'
import { fetchGalleryPhotos } from '@/lib/actions/photo.actions'
import { resolveWatermarkText } from '@/lib/images/process'
import { signStoragePaths, resolvePrivateGalleryPaths } from '@/lib/storage'
import { unwrapOne } from '@/lib/unwrap'
import { Upload, Send } from 'lucide-react'
import { GalleryPhotosSection } from '@/components/gallery/GalleryPhotosSection'
import { SendGalleryToClientButton } from '@/components/dashboard/SendGalleryToClientButton'
import type { Gallery, GallerySettings, Client } from '@/lib/types/database.types'
import { isPhotoLimitTestUser } from '@/lib/gallery-photo-limits'
import { galleryKind } from '@/lib/gallery-kind'

type PhotosPageProps = {
  params: Promise<{ id: string }>
}

export default async function GalleryPhotosPage({ params }: PhotosPageProps) {
  const { id } = await params
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    notFound()
  }

  const { userId, supabase } = context

  const { data: profileData } = await supabase
    .from('users')
    .select('studio_name')
    .eq('id', userId)
    .single()

  const studioName =
    (profileData as { studio_name: string | null } | null)?.studio_name ?? null

  const galleryData = await fetchGalleryDetail(id)
  if (!galleryData) notFound()

  type Detail = Gallery & {
    clients: Client | Client[] | null
    gallery_settings: GallerySettings | GallerySettings[] | null
  }
  const galleryDetail = galleryData as Detail
  const settings = unwrapOne(galleryDetail.gallery_settings)
  const isClientGallery = galleryKind(galleryDetail) === 'client'
  const hasClient = Array.isArray(galleryDetail.clients)
    ? galleryDetail.clients.length > 0
    : galleryDetail.clients != null

  const photos = await fetchGalleryPhotos(id)
  const previewPaths = photos.map((p) => (p as { preview_url: string | null }).preview_url)
  // Private client gallery → serve the owner her media through the
  // content-filter-exempt subdomain; showcase galleries stay on the public CDN.
  const signedUrls = isClientGallery
    ? await resolvePrivateGalleryPaths('previews', previewPaths)
    : await signStoragePaths('previews', previewPaths)

  return (
    <div className="animate-fade-in space-y-8 sm:space-y-12">
      {isClientGallery && hasClient ? (
        <section className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#100d1f] sm:text-xl">
              <Send className="h-5 w-5" />
              שליחה ללקוח
            </h2>
            <p className="text-sm text-[#48464c]">
              לאחר שהתמונות עלו — שלחי ללקוח מייל עם קישור לגלריה
            </p>
          </div>
          <SendGalleryToClientButton galleryId={id} status={galleryDetail.status} />
        </section>
      ) : null}

      <section className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#100d1f] sm:text-xl">
            <Upload className="h-5 w-5" />
            העלאת תמונות
          </h2>
          <p className="text-sm text-[#48464c]">
            {isClientGallery
              ? 'העלאת תמונות לגלריה — נשמרות גם תמונות המקור'
              : 'העלאת תמונות לגלריה'}
          </p>
        </div>
        <GalleryPhotosSection
          galleryId={id}
          userId={userId}
          watermarkText={resolveWatermarkText(settings?.watermark_text, studioName)}
          applyAutoWatermark={settings?.auto_apply_watermark ?? true}
          photos={photos as never}
          signedUrls={signedUrls}
          showWizardHeader={false}
          publicOnlyMvp={!isClientGallery}
          photoCountLimitBypassed={isPhotoLimitTestUser(userId)}
          storeOriginalPhotos={isClientGallery}
        />
      </section>
    </div>
  )
}
