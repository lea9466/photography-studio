import { createAdminClient } from '@/lib/supabase/admin'
import { PUBLIC_ONLY_MVP } from '@/lib/types/app.types'

export type PublicGalleryPageRow = {
  id: string
  title: string
  created_at: string
  user_id: string
  is_public: boolean
  gallery_type: string | null
  slug: string | null
}

type AdminClient = ReturnType<typeof createAdminClient>

export async function fetchGalleryForPublicPage(
  admin: AdminClient,
  galleryId: string
): Promise<PublicGalleryPageRow | null> {
  const normalizedId = galleryId.trim()
  console.log('[public-gallery] fetch request', {
    galleryId: normalizedId,
    publicOnlyMvp: PUBLIC_ONLY_MVP,
  })

  let query = admin
    .from('galleries')
    .select('id, title, created_at, user_id, is_public, gallery_type, slug')
    .eq('id', normalizedId)

  if (!PUBLIC_ONLY_MVP) {
    query = query.eq('is_public', true)
  }

  const { data, error } = await query.maybeSingle()

  console.log('[public-gallery] fetch result', {
    galleryId: normalizedId,
    found: Boolean(data),
    is_public: (data as PublicGalleryPageRow | null)?.is_public ?? null,
    gallery_type: (data as PublicGalleryPageRow | null)?.gallery_type ?? null,
    slug: (data as PublicGalleryPageRow | null)?.slug ?? null,
    error: error?.message ?? null,
  })

  if (error || !data) return null

  const gallery = data as PublicGalleryPageRow
  if (!PUBLIC_ONLY_MVP && !gallery.is_public) return null

  return gallery
}
