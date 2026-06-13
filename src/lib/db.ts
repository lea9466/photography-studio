import { cache } from 'react'
import { mapSiteSettingsRow } from '@/lib/map-site-settings'
import { getAdminClient } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { type SupabaseClient } from '@supabase/supabase-js'
import type {
  AlbumsRow,
  ClientsRow,
  Database,
  ImageSelectionsRow,
  ImagesRow,
  PackagesRow,
  PhotographersRow,
  SiteSettingsRow,
  UsersRow,
} from '@/lib/database.types'

export type { SiteSettingsRow as SiteSettings } from '@/lib/database.types'

type DbClient = SupabaseClient<Database, 'public'>

async function fetchSiteSettingsRow(
  client: DbClient,
  label: string,
  photographerId: string
): Promise<SiteSettingsRow | null> {
  const { data, error } = await client
    .from('site_settings')
    .select('*')
    .eq('photographer_id', photographerId)
    .maybeSingle()

  if (error) {
    console.error(`site_settings (${label}):`, error.message, error.code)
    return null
  }

  const raw = data as Record<string, unknown> | undefined
  if (!raw) return null
  return mapSiteSettingsRow(raw)
}

async function fetchPhotographerBySlugWith(
  client: DbClient,
  label: string,
  slug: string
) {
  const { data, error } = await client
    .from('photographers')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error(`photographers (${label}):`, error.message, error.code)
    return null
  }
  return data
}

/** צלם לפי slug מה-URL (multi-tenant). */
export const fetchPhotographerBySlug = cache(async function fetchPhotographerBySlug(
  slug: string
): Promise<PhotographersRow | null> {
  const clean = slug.trim()
  if (!clean) return null

  const admin = getAdminClient()
  if (admin) {
    const row = await fetchPhotographerBySlugWith(admin, 'service', clean)
    if (row) return row
  }

  return fetchPhotographerBySlugWith(supabase, 'anon', clean)
})

/** slug ברירת מחדל — הצלם הראשון ב-DB (לניתוב מ-/). */
export async function fetchDefaultPhotographerSlug(): Promise<string | null> {
  const admin = getAdminClient()
  const client = admin ?? supabase
  const label = admin ? 'service' : 'anon'

  const { data, error } = await client
    .from('photographers')
    .select('slug')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(`photographers default slug (${label}):`, error.message)
    return null
  }
  return data?.slug ?? null
}

/**
 * הגדרות אתר לדפים ציבוריים (שרת בלבד) — לפי slug של הצלם ב-URL.
 * קודם service role — כמו /admin — כי anon לעיתים לא רואה את אותה שורה (RLS).
 */
export async function fetchSiteSettings(
  photographerSlug: string
): Promise<SiteSettingsRow | null> {
  const photographer = await fetchPhotographerBySlug(photographerSlug)
  if (!photographer) return null

  const admin = getAdminClient()
  if (admin) {
    const row = await fetchSiteSettingsRow(admin, 'service', photographer.id)
    if (row) return row
  }

  return fetchSiteSettingsRow(supabase, 'anon', photographer.id)
}

/** משתמש לפי Supabase Auth user id (`auth.users.id`). */
export async function fetchUserByAuthId(
  authId: string
): Promise<UsersRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle()

  if (error) {
    console.error('users:', error.message)
    return null
  }
  return data
}

/** לקוח לפי `users.id`. */
export async function fetchClientByUserId(
  userId: string
): Promise<ClientsRow | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('clients:', error.message)
    return null
  }
  return data
}

/** אלבומים של לקוח. */
export async function fetchAlbumsByClientId(
  clientId: string
): Promise<AlbumsRow[]> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('albums:', error.message)
    return []
  }
  return data ?? []
}

/** אלבום עם תמונות (join). */
export async function fetchAlbumWithImages(albumId: string) {
  const { data, error } = await supabase
    .from('albums')
    .select('*, images(*)')
    .eq('id', albumId)
    .maybeSingle()

  if (error) {
    console.error('albums+images:', error.message)
    return null
  }
  return data as (AlbumsRow & { images: ImagesRow[] }) | null
}

/** תמונות באלבום. */
export async function fetchImagesByAlbumId(
  albumId: string
): Promise<ImagesRow[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('images:', error.message)
    return []
  }
  return data ?? []
}

/** בחירות לקוח (אופציונלי: לפי תמונה). */
export async function fetchSelectionsByClientId(
  clientId: string,
  imageId?: string
): Promise<ImageSelectionsRow[]> {
  let query = supabase
    .from('image_selections')
    .select('*')
    .eq('client_id', clientId)

  if (imageId) query = query.eq('image_id', imageId)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('image_selections:', error.message)
    return []
  }
  return data ?? []
}

export async function insertImageSelection(
  row: Database['public']['Tables']['image_selections']['Insert']
) {
  return supabase.from('image_selections').insert(row).select().single()
}

export async function insertDownloadLog(
  row: Database['public']['Tables']['download_logs']['Insert']
) {
  return supabase.from('download_logs').insert(row).select().single()
}

export type PublicAlbumPreview = Pick<
  AlbumsRow,
  'id' | 'title' | 'cover_image' | 'status' | 'created_at' | 'photographer_id'
>

async function fetchPublicAlbumsWith(
  client: DbClient,
  label: string,
  limit: number,
  photographerId?: string
): Promise<PublicAlbumPreview[]> {
  let query = client
    .from('albums')
    .select('id, title, cover_image, status, created_at, photographer_id')
    .eq('status', 'active')
    .eq('is_public', true)

  if (photographerId) {
    query = query.eq('photographer_id', photographerId)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error(`albums (${label}):`, error.message)
    return []
  }
  return data ?? []
}

/** אלבומים פעילים לגלריה ציבורית (שרת). */
export async function fetchPublicAlbums(
  limit = 24,
  photographerId?: string
): Promise<PublicAlbumPreview[]> {
  const admin = getAdminClient()
  if (admin) {
    const rows = await fetchPublicAlbumsWith(admin, 'service', limit, photographerId)
    if (rows.length > 0) return rows
  }
  return fetchPublicAlbumsWith(supabase, 'anon', limit, photographerId)
}

export type PublicAlbumCardPreview = Pick<
  AlbumsRow,
  'id' | 'title' | 'cover_image' | 'photographer_id'
> & { image_count: number }

const PUBLIC_ALBUM_CARD_SELECT =
  'id, title, cover_image, photographer_id, images(count)'

/** מסנן תמונות מקוננות — רק ready (לא pending באמצע העלאה). */
const PUBLIC_READY_IMAGES_STATUS = 'ready' as const

type PublicAlbumCardRow = Pick<
  AlbumsRow,
  'id' | 'title' | 'cover_image' | 'photographer_id'
> & { images: { count: number }[] }

function normalizePublicAlbumCardRows(rows: PublicAlbumCardRow[]): PublicAlbumCardPreview[] {
  return rows.map((album) => ({
    id: album.id,
    title: album.title,
    cover_image: album.cover_image,
    photographer_id: album.photographer_id,
    image_count: album.images?.[0]?.count ?? 0,
  }))
}

async function fetchPublicAlbumsWithImageCountWith(
  client: DbClient,
  label: string,
  limit: number,
  photographerId?: string
): Promise<PublicAlbumCardPreview[]> {
  let query = client
    .from('albums')
    .select(PUBLIC_ALBUM_CARD_SELECT)
    .eq('status', 'active')
    .eq('is_public', true)
    .eq('images.status', PUBLIC_READY_IMAGES_STATUS)

  if (photographerId) {
    query = query.eq('photographer_id', photographerId)
  }

  let { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error?.message?.includes('status')) {
    let fallbackQuery = client
      .from('albums')
      .select(PUBLIC_ALBUM_CARD_SELECT)
      .eq('status', 'active')
      .eq('is_public', true)
    if (photographerId) {
      fallbackQuery = fallbackQuery.eq('photographer_id', photographerId)
    }
    const fallback = await fallbackQuery
      .order('created_at', { ascending: false })
      .limit(limit)
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error(`albums+card-count (${label}):`, error.message)
    return []
  }

  return normalizePublicAlbumCardRows((data ?? []) as unknown as PublicAlbumCardRow[])
}

/** אלבומים ציבוריים עם cover וספירת תמונות — לכרטיסי גלריה בדף הבית. */
export async function fetchPublicAlbumsWithImageCount(
  limit = 12,
  photographerId?: string
): Promise<PublicAlbumCardPreview[]> {
  const admin = getAdminClient()
  if (admin) {
    const rows = await fetchPublicAlbumsWithImageCountWith(
      admin,
      'service',
      limit,
      photographerId
    )
    if (rows.length > 0) return rows
  }
  return fetchPublicAlbumsWithImageCountWith(supabase, 'anon', limit, photographerId)
}

export type PublicAlbumImage = Pick<
  ImagesRow,
  'id' | 'created_at' | 'original_ext'
>

export type PublicAlbumWithImages = PublicAlbumPreview & {
  images: PublicAlbumImage[]
}

const PUBLIC_ALBUM_WITH_IMAGES_SELECT =
  'id, title, cover_image, status, created_at, photographer_id, images(id, created_at, original_ext)'
const PUBLIC_ALBUM_WITH_IMAGES_SELECT_FALLBACK =
  'id, title, cover_image, status, created_at, photographer_id, images(id, created_at)'

function sortPublicAlbumImages(
  album: PublicAlbumWithImages
): PublicAlbumWithImages {
  return {
    ...album,
    images: [...(album.images ?? [])].sort((a, b) =>
      (a.created_at ?? '').localeCompare(b.created_at ?? '')
    ),
  }
}

function normalizePublicAlbumsWithImages(
  rows: PublicAlbumWithImages[],
  includeOriginalExt: boolean
): PublicAlbumWithImages[] {
  return rows.map((album) =>
    sortPublicAlbumImages({
      ...album,
      images: (album.images ?? []).map((image) => ({
        ...image,
        original_ext: includeOriginalExt ? (image.original_ext ?? null) : null,
      })),
    })
  )
}

async function fetchPublicAlbumsWithImagesWith(
  client: DbClient,
  label: string,
  limit: number,
  photographerId?: string
): Promise<PublicAlbumWithImages[]> {
  const buildQuery = (select: string, filterReadyImages: boolean) => {
    let query = client
      .from('albums')
      .select(select)
      .eq('status', 'active')
      .eq('is_public', true)

    if (filterReadyImages) {
      query = query.eq('images.status', PUBLIC_READY_IMAGES_STATUS)
    }

    if (photographerId) {
      query = query.eq('photographer_id', photographerId)
    }

    return query.order('created_at', { ascending: false }).limit(limit)
  }

  let { data, error } = await buildQuery(PUBLIC_ALBUM_WITH_IMAGES_SELECT, true)

  if (error?.message?.includes('status')) {
    const fallback = await buildQuery(PUBLIC_ALBUM_WITH_IMAGES_SELECT, false)
    data = fallback.data
    error = fallback.error
  }

  if (error?.message?.includes('original_ext')) {
    const fallback = await buildQuery(PUBLIC_ALBUM_WITH_IMAGES_SELECT_FALLBACK, true)
    data = fallback.data
    error = fallback.error
    if (error?.message?.includes('status')) {
      const legacy = await buildQuery(PUBLIC_ALBUM_WITH_IMAGES_SELECT_FALLBACK, false)
      data = legacy.data
      error = legacy.error
    }
    if (!error) {
      return normalizePublicAlbumsWithImages(
        (data ?? []) as unknown as PublicAlbumWithImages[],
        false
      )
    }
  }

  if (error) {
    console.error(`albums+images (${label}):`, error.message)
    return []
  }

  return normalizePublicAlbumsWithImages(
    (data ?? []) as unknown as PublicAlbumWithImages[],
    true
  )
}

/** אלבומים פעילים לגלריה ציבורית, כולל כל התמונות שלהם (שרת). */
export async function fetchPublicAlbumsWithImages(
  limit = 24,
  photographerId?: string
): Promise<PublicAlbumWithImages[]> {
  const admin = getAdminClient()
  if (admin) {
    const rows = await fetchPublicAlbumsWithImagesWith(
      admin,
      'service',
      limit,
      photographerId
    )
    if (rows.length > 0) return rows
  }
  return fetchPublicAlbumsWithImagesWith(supabase, 'anon', limit, photographerId)
}

async function fetchPublicAlbumByIdWith(
  client: DbClient,
  label: string,
  id: string,
  photographerId?: string
): Promise<PublicAlbumWithImages | null> {
  const buildQuery = (select: string, filterReadyImages: boolean) => {
    let query = client
      .from('albums')
      .select(select)
      .eq('id', id)
      .eq('status', 'active')
      .eq('is_public', true)

    if (filterReadyImages) {
      query = query.eq('images.status', PUBLIC_READY_IMAGES_STATUS)
    }

    if (photographerId) {
      query = query.eq('photographer_id', photographerId)
    }

    return query.maybeSingle()
  }

  let { data, error } = await buildQuery(PUBLIC_ALBUM_WITH_IMAGES_SELECT, true)

  if (error?.message?.includes('status')) {
    const fallback = await buildQuery(PUBLIC_ALBUM_WITH_IMAGES_SELECT, false)
    data = fallback.data
    error = fallback.error
  }

  if (error?.message?.includes('original_ext')) {
    const fallback = await buildQuery(PUBLIC_ALBUM_WITH_IMAGES_SELECT_FALLBACK, true)
    data = fallback.data
    error = fallback.error
    if (error?.message?.includes('status')) {
      const legacy = await buildQuery(PUBLIC_ALBUM_WITH_IMAGES_SELECT_FALLBACK, false)
      data = legacy.data
      error = legacy.error
    }
    if (!error && data) {
      return normalizePublicAlbumsWithImages(
        [data as unknown as PublicAlbumWithImages],
        false
      )[0]
    }
  }

  if (error) {
    console.error(`album+images by id (${label}):`, error.message)
    return null
  }
  if (!data) return null

  return normalizePublicAlbumsWithImages(
    [data as unknown as PublicAlbumWithImages],
    true
  )[0]
}

/** אלבום ציבורי בודד (פעיל) כולל תמונותיו, לפי מזהה (שרת). */
export async function fetchPublicAlbumById(
  id: string,
  photographerId?: string
): Promise<PublicAlbumWithImages | null> {
  const admin = getAdminClient()
  if (admin) {
    const row = await fetchPublicAlbumByIdWith(admin, 'service', id, photographerId)
    if (row) return row
  }
  return fetchPublicAlbumByIdWith(supabase, 'anon', id, photographerId)
}

async function fetchActivePackagesWith(
  client: DbClient,
  label: string,
  photographerId?: string
): Promise<PackagesRow[]> {
  let query = client
    .from('packages')
    .select('*')
    .eq('is_active', true)

  if (photographerId) {
    query = query.eq('photographer_id', photographerId)
  }

  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error(`packages (${label}):`, error.message)
    return []
  }
  return data ?? []
}

/** חבילות תמחור פעילות לדף המחירון הציבורי (שרת). */
export async function fetchActivePackages(
  photographerId?: string
): Promise<PackagesRow[]> {
  const admin = getAdminClient()
  if (admin) {
    const rows = await fetchActivePackagesWith(admin, 'service', photographerId)
    if (rows.length > 0) return rows
  }
  return fetchActivePackagesWith(supabase, 'anon', photographerId)
}
