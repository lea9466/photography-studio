import { createAdminClient } from '@/lib/supabase/admin'
import { PUBLIC_ONLY_MVP } from '@/lib/types/app.types'
import { normalizeRouteParam } from '@/lib/queries/public-gallery-page'

export type PortfolioGalleryPageRow = {
  id: string
  title: string
  user_id: string
  is_public: boolean
  gallery_type: string | null
  slug: string | null
}

type AdminClient = ReturnType<typeof createAdminClient>

const PORTFOLIO_GALLERY_FIELDS = 'id, title, user_id, is_public, gallery_type, slug'

function logDbError(scope: string, context: Record<string, unknown>, error: unknown) {
  if (!error || typeof error !== 'object') {
    console.error(`[${scope}] unexpected error`, { ...context, error: String(error) })
    return
  }

  const dbError = error as {
    message?: string
    code?: string
    details?: string
    hint?: string
  }

  console.error(`[${scope}] database error`, {
    ...context,
    code: dbError.code ?? null,
    message: dbError.message ?? null,
    details: dbError.details ?? null,
    hint: dbError.hint ?? null,
  })
}

function isGalleryAccessible(gallery: PortfolioGalleryPageRow): boolean {
  if (PUBLIC_ONLY_MVP) return true
  return gallery.is_public === true
}

async function queryPortfolioGallery(
  admin: AdminClient,
  slug: string,
  match: 'exact' | 'case_insensitive'
) {
  let query = admin
    .from('galleries')
    .select(PORTFOLIO_GALLERY_FIELDS)
    .eq('gallery_type', 'portfolio')

  query =
    match === 'exact'
      ? query.eq('slug', slug)
      : query.ilike('slug', slug)

  if (!PUBLIC_ONLY_MVP) {
    query = query.eq('is_public', true)
  }

  return query.maybeSingle()
}

export async function fetchPortfolioGalleryBySlug(
  admin: AdminClient,
  rawSlug: string
): Promise<PortfolioGalleryPageRow | null> {
  const normalizedSlug = normalizeRouteParam(rawSlug)

  console.log('[portfolio-gallery] route trace start', {
    rawSlug,
    normalizedSlug,
    publicOnlyMvp: PUBLIC_ONLY_MVP,
  })

  if (!normalizedSlug) {
    console.warn('[portfolio-gallery] reject', { reason: 'empty_slug' })
    return null
  }

  const exact = await queryPortfolioGallery(admin, normalizedSlug, 'exact')
  if (exact.error) {
    logDbError('portfolio-gallery', { normalizedSlug, lookup: 'exact' }, exact.error)
    return null
  }

  let gallery = (exact.data as PortfolioGalleryPageRow | null) ?? null

  if (!gallery) {
    console.warn('[portfolio-gallery] exact slug miss, trying case-insensitive match', {
      normalizedSlug,
    })

    const insensitive = await queryPortfolioGallery(admin, normalizedSlug, 'case_insensitive')
    if (insensitive.error) {
      logDbError(
        'portfolio-gallery',
        { normalizedSlug, lookup: 'case_insensitive' },
        insensitive.error
      )
      return null
    }

    gallery = (insensitive.data as PortfolioGalleryPageRow | null) ?? null
  }

  if (!gallery) {
    const { data: slugHints } = await admin
      .from('galleries')
      .select('id, slug, gallery_type, is_public, title')
      .ilike('slug', `%${normalizedSlug}%`)
      .limit(5)

    console.warn('[portfolio-gallery] reject', {
      reason: 'not_found',
      normalizedSlug,
      nearbyMatches: slugHints ?? [],
    })
    return null
  }

  if (gallery.gallery_type !== 'portfolio') {
    console.warn('[portfolio-gallery] reject', {
      reason: 'wrong_gallery_type',
      normalizedSlug,
      gallery_type: gallery.gallery_type,
      galleryId: gallery.id,
    })
    return null
  }

  if (!isGalleryAccessible(gallery)) {
    console.warn('[portfolio-gallery] reject', {
      reason: 'not_public',
      normalizedSlug,
      galleryId: gallery.id,
      is_public: gallery.is_public,
    })
    return null
  }

  console.log('[portfolio-gallery] accept', {
    normalizedSlug,
    galleryId: gallery.id,
    slug: gallery.slug,
    is_public: gallery.is_public,
  })

  return gallery
}

/**
 * Portfolio galleries without a slug cannot be served at /portfolio/[slug].
 * Fall back to the UUID public gallery route when possible.
 */
export function resolvePortfolioPublicPath(gallery: {
  id: string
  slug: string | null
  gallery_type: string | null
}): string {
  if (gallery.gallery_type === 'portfolio' && gallery.slug?.trim()) {
    return `/portfolio/${gallery.slug.trim()}`
  }
  return `/public-gallery/${gallery.id}`
}
