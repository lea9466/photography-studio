import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'
import { fetchGalleryPhotos } from '@/lib/actions/photo.actions'
import { signStoragePaths } from '@/lib/storage'
import { unwrapOne } from '@/lib/unwrap'
import { GalleryPhotosSection } from '@/components/gallery/GalleryPhotosSection'
import type { GallerySettings } from '@/lib/types/database.types'

type PhotosPageProps = {
  params: Promise<{ id: string }>
}

export default async function GalleryPhotosPage({ params }: PhotosPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const galleryData = await fetchGalleryDetail(id)
  if (!galleryData) notFound()

  type Detail = {
    gallery_settings: GallerySettings | GallerySettings[] | null
  }
  const settings = unwrapOne((galleryData as Detail).gallery_settings)

  const photos = await fetchGalleryPhotos(id)
  const signedUrls = await signStoragePaths(
    'previews',
    photos.map((p) => (p as { preview_url: string | null }).preview_url)
  )

  return (
    <GalleryPhotosSection
      galleryId={id}
      userId={user.id}
      watermarkText={settings?.watermark_text}
      photos={photos as never}
      signedUrls={signedUrls}
    />
  )
}
