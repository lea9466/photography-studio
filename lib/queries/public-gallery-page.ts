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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const GALLERY_PUBLIC_FIELDS =
  'id, title, created_at, user_id, is_public, gallery_type, slug'

export function normalizeRouteParam(value: string): string {
  try {
    return decodeURIComponent(value).trim()
  } catch {
    return value.trim()
  }
}

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

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

function isGalleryAccessible(gallery: PublicGalleryPageRow): boolean {
  if (PUBLIC_ONLY_MVP) return true
  return gallery.is_public === true
}

function acceptGallery(
  scope: string,
  context: Record<string, unknown>,
  gallery: PublicGalleryPageRow | null,
  reason: string
): PublicGalleryPageRow | null {
  if (!gallery) {
    console.warn(`[${scope}] reject`, { ...context, reason: 'not_found' })
    return null
  }

  if (!isGalleryAccessible(gallery)) {
    console.warn(`[${scope}] reject`, {
      ...context,
      reason,
      is_public: gallery.is_public,
      gallery_type: gallery.gallery_type,
      slug: gallery.slug,
    })
    return null
  }

  console.log(`[${scope}] accept`, {
    ...context,
    galleryId: gallery.id,
    is_public: gallery.is_public,
    gallery_type: gallery.gallery_type,
    slug: gallery.slug,
  })

  return gallery
}

async function fetchGalleryByUuid(
  admin: AdminClient,
  galleryId: string
): Promise<{ gallery: PublicGalleryPageRow | null; error: unknown }> {
  let query = admin.from('galleries').select(GALLERY_PUBLIC_FIELDS).eq('id', galleryId)

  if (!PUBLIC_ONLY_MVP) {
    query = query.eq('is_public', true)
  }

  const { data, error } = await query.maybeSingle()
  return { gallery: (data as PublicGalleryPageRow | null) ?? null, error }
}

async function fetchGalleryBySlug(
  admin: AdminClient,
  slug: string
): Promise<{ gallery: PublicGalleryPageRow | null; error: unknown }> {
  let query = admin.from('galleries').select(GALLERY_PUBLIC_FIELDS).eq('slug', slug)

  if (!PUBLIC_ONLY_MVP) {
    query = query.eq('is_public', true)
  }

  const { data, error } = await query.maybeSingle()
  return { gallery: (data as PublicGalleryPageRow | null) ?? null, error }
}

export async function fetchGalleryForPublicPage(
  admin: AdminClient,
  rawGalleryId: string
): Promise<PublicGalleryPageRow | null> {
  const normalizedId = normalizeRouteParam(rawGalleryId)
  const looksLikeUuid = isUuid(normalizedId)

  console.log('[public-gallery] route trace start', {
    rawGalleryId,
    normalizedId,
    looksLikeUuid,
    publicOnlyMvp: PUBLIC_ONLY_MVP,
  })

  if (!normalizedId) {
    console.warn('[public-gallery] reject', { reason: 'empty_id' })
    return null
  }

  if (looksLikeUuid) {
    const { gallery, error } = await fetchGalleryByUuid(admin, normalizedId)
    if (error) {
      logDbError('public-gallery', { normalizedId, lookup: 'uuid' }, error)
      return null
    }

    return acceptGallery(
      'public-gallery',
      { normalizedId, lookup: 'uuid' },
      gallery,
      'not_public'
    )
  }

  console.warn('[public-gallery] non-uuid param received, trying slug fallback', {
    normalizedId,
  })

  const { gallery, error } = await fetchGalleryBySlug(admin, normalizedId)
  if (error) {
    logDbError('public-gallery', { normalizedId, lookup: 'slug_fallback' }, error)
    return null
  }

  return acceptGallery(
    'public-gallery',
    { normalizedId, lookup: 'slug_fallback' },
    gallery,
    'not_public'
  )
}
