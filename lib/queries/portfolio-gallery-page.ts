import { createAdminClient } from '@/lib/supabase/admin'
import { PUBLIC_ONLY_MVP } from '@/lib/types/app.types'

export type PortfolioGalleryPageRow = {
  id: string
  title: string
  user_id: string
  is_public: boolean
  gallery_type: string | null
  slug: string | null
}

type AdminClient = ReturnType<typeof createAdminClient>

export async function fetchPortfolioGalleryBySlug(
  admin: AdminClient,
  slug: string
): Promise<PortfolioGalleryPageRow | null> {
  const normalizedSlug = slug.trim()
  console.log('[portfolio-gallery] fetch request', {
    slug: normalizedSlug,
    publicOnlyMvp: PUBLIC_ONLY_MVP,
  })

  let query = admin
    .from('galleries')
    .select('id, title, user_id, is_public, gallery_type, slug')
    .eq('slug', normalizedSlug)
    .eq('gallery_type', 'portfolio')

  if (!PUBLIC_ONLY_MVP) {
    query = query.eq('is_public', true)
  }

  const { data, error } = await query.maybeSingle()

  console.log('[portfolio-gallery] fetch result', {
    slug: normalizedSlug,
    found: Boolean(data),
    is_public: (data as PortfolioGalleryPageRow | null)?.is_public ?? null,
    gallery_type: (data as PortfolioGalleryPageRow | null)?.gallery_type ?? null,
    error: error?.message ?? null,
  })

  if (error || !data) return null

  const gallery = data as PortfolioGalleryPageRow
  if (!PUBLIC_ONLY_MVP && !gallery.is_public) return null

  return gallery
}
