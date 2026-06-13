import { randomBytes } from 'crypto'
import {
  removeAlbumStorageFolder,
  removeStoragePaths,
} from '@/lib/albums-storage'
import {
  galleryOriginalObjectKey,
  galleryThumbnailObjectKey,
} from '@/lib/gallery-media-urls'
import { r2PublicUrlFromKey } from '@/lib/r2-public'
import { isAlbumOwnedCoverUrl } from '@/lib/storage-urls'
import { adminResolvePhotographerId } from '@/lib/photographer-scope'
import { getAdminClient } from '@/lib/supabase-admin'
import type {
  AlbumsRow,
  ClientsRow,
  ImagesRow,
  PackagesRow,
  SiteSettingsRow,
  UsersRow,
} from '@/lib/database.types'

export type ClientWithUser = ClientsRow & {
  users: Pick<UsersRow, 'id' | 'email' | 'role' | 'access_code'> | null
}

export type AlbumWithClient = AlbumsRow & {
  clients: Pick<ClientsRow, 'id' | 'full_name'> | null
}

function client() {
  return getAdminClient()
}

async function scopedPhotographerId(
  photographerId?: string | null
): Promise<string | null> {
  if (photographerId) return photographerId
  return adminResolvePhotographerId()
}

type AdminClient = NonNullable<ReturnType<typeof getAdminClient>>

const IMAGE_DEPENDENTS_PAGE = 500
const IMAGE_DB_BATCH = 100

/** מוחק בחירות לקוח ולוגים לפני מחיקת שורות images (תומך באלפי תמונות). */
async function adminClearImageDependentsForAlbum(
  sb: AdminClient,
  albumId: string
): Promise<{ error: string | null }> {
  let from = 0
  while (true) {
    const { data: page, error: selectError } = await sb
      .from('images')
      .select('id')
      .eq('album_id', albumId)
      .range(from, from + IMAGE_DEPENDENTS_PAGE - 1)

    if (selectError) return { error: selectError.message }

    const imageIds = page?.map((i) => i.id) ?? []
    if (imageIds.length === 0) break

    const { error: selectionsError } = await sb
      .from('image_selections')
      .delete()
      .in('image_id', imageIds)
    if (selectionsError) return { error: selectionsError.message }

    const { error: logsError } = await sb
      .from('download_logs')
      .delete()
      .in('image_id', imageIds)
    if (logsError) return { error: logsError.message }

    if (imageIds.length < IMAGE_DEPENDENTS_PAGE) break
    from += IMAGE_DEPENDENTS_PAGE
  }

  return { error: null }
}

async function adminFindScopedSiteSettingsId(
  photographerId?: string | null
): Promise<string | null> {
  const sb = client()
  if (!sb) return null

  const pid = await scopedPhotographerId(photographerId)
  let query = sb.from('site_settings').select('id')

  if (pid) {
    query = query.eq('photographer_id', pid)
  }

  const { data, error } = await query
    .order('id', { ascending: false })
    .limit(1)
  if (error) {
    console.error('admin site_settings id:', error.message)
    return null
  }
  return data?.[0]?.id ?? null
}

export async function adminFetchSiteSettings(
  photographerId?: string | null
): Promise<SiteSettingsRow | null> {
  const sb = client()
  if (!sb) return null

  const pid = await scopedPhotographerId(photographerId)
  let query = sb.from('site_settings').select('*')

  if (pid) {
    query = query.eq('photographer_id', pid)
  }

  const { data, error } = await query
    .order('id', { ascending: false })
    .limit(1)
  if (error) {
    console.error('admin site_settings:', error.message)
    return null
  }
  return data?.[0] ?? null
}

export async function adminFetchClients(
  photographerId?: string | null
): Promise<ClientWithUser[]> {
  const sb = client()
  if (!sb) return []

  const pid = await scopedPhotographerId(photographerId)
  let query = sb.from('clients').select('*')

  if (pid) {
    query = query.eq('photographer_id', pid)
  }

  const { data: clients, error } = await query.order('created_at', {
    ascending: false,
  })

  if (error) {
    console.error('admin clients:', error.message)
    return []
  }
  if (!clients?.length) return []

  const userIds = [...new Set(clients.map((c) => c.user_id))]
  const { data: users } = await sb
    .from('users')
    .select('id, email, role, access_code')
    .in('id', userIds)

  const userMap = new Map((users ?? []).map((u) => [u.id, u]))

  return clients.map((c) => ({
    ...c,
    users: userMap.get(c.user_id) ?? null,
  }))
}

export async function adminFetchAlbums(
  photographerId?: string | null
): Promise<AlbumWithClient[]> {
  const sb = client()
  if (!sb) return []

  const pid = await scopedPhotographerId(photographerId)
  let query = sb.from('albums').select('*')

  if (pid) {
    query = query.eq('photographer_id', pid)
  }

  const { data: albums, error } = await query.order('created_at', {
    ascending: false,
  })

  if (error) {
    console.error('admin albums:', error.message)
    return []
  }
  if (!albums?.length) return []

  const clientIds = [...new Set(albums.map((a) => a.client_id))]
  const { data: clients } = await sb
    .from('clients')
    .select('id, full_name')
    .in('id', clientIds)

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]))

  return albums.map((a) => ({
    ...a,
    clients: clientMap.get(a.client_id) ?? null,
  }))
}

export async function adminFetchClientsForSelect(
  photographerId?: string | null
): Promise<Pick<ClientsRow, 'id' | 'full_name'>[]> {
  const sb = client()
  if (!sb) return []

  const pid = await scopedPhotographerId(photographerId)
  let query = sb.from('clients').select('id, full_name')

  if (pid) {
    query = query.eq('photographer_id', pid)
  }

  const { data, error } = await query.order('full_name', { ascending: true })

  if (error) return []
  return data ?? []
}

const GALLERY_CLIENT_NAME = 'גלריה כללית'
const GALLERY_CLIENT_EMAIL = 'gallery@studio.internal'

/** לקוח ברירת מחדל לגלריות ציבוריות כשאין לקוחות במערכת. */
export async function adminEnsureGalleryClient(
  photographerId?: string | null
): Promise<string | null> {
  const sb = client()
  if (!sb) return null

  const pid = await scopedPhotographerId(photographerId)

  let namedQuery = sb
    .from('clients')
    .select('id')
    .eq('full_name', GALLERY_CLIENT_NAME)

  if (pid) {
    namedQuery = namedQuery.eq('photographer_id', pid)
  }

  const { data: named } = await namedQuery.limit(1)

  if (named?.[0]?.id) return named[0].id

  let anyQuery = sb.from('clients').select('id')
  if (pid) {
    anyQuery = anyQuery.eq('photographer_id', pid)
  }
  const { data: anyClient } = await anyQuery.limit(1)
  if (anyClient?.[0]?.id) return anyClient[0].id

  const { error } = await adminCreateClient({
    full_name: GALLERY_CLIENT_NAME,
    phone: '',
    email: GALLERY_CLIENT_EMAIL,
    access_code: '',
  })
  if (error) {
    console.error('ensure gallery client:', error)
    return null
  }

  const { data: created } = await sb
    .from('clients')
    .select('id')
    .eq('full_name', GALLERY_CLIENT_NAME)
    .limit(1)

  return created?.[0]?.id ?? null
}

export async function adminFetchPendingImagesByAlbumId(
  albumId: string
): Promise<Pick<ImagesRow, 'id' | 'original_ext' | 'created_at'>[]> {
  const sb = client()
  if (!sb) return []

  const { data, error } = await sb
    .from('images')
    .select('id, original_ext, created_at')
    .eq('album_id', albumId.trim())
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('pending images:', error.message)
    return []
  }
  return data ?? []
}

/** מוחק שורות pending יתומות בגלריה (העלאה שנקטעה). */
export async function adminCleanupPendingImagesForAlbum(
  albumId: string
): Promise<{ error: string | null; deletedCount: number }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', deletedCount: 0 }

  const cleanAlbumId = albumId.trim()
  if (!cleanAlbumId) return { error: 'חסר מזהה גלריה', deletedCount: 0 }

  let deletedCount = 0

  while (true) {
    const { data: page, error: selectError } = await sb
      .from('images')
      .select('id')
      .eq('album_id', cleanAlbumId)
      .eq('status', 'pending')
      .limit(IMAGE_DB_BATCH)

    if (selectError) return { error: selectError.message, deletedCount }

    const imageIds = page?.map((row) => row.id) ?? []
    if (imageIds.length === 0) break

    const depError = await adminClearImageDependentsForImageIds(sb, imageIds)
    if (depError) return { error: depError, deletedCount }

    const { error: deleteError } = await sb.from('images').delete().in('id', imageIds)
    if (deleteError) return { error: deleteError.message, deletedCount }

    deletedCount += imageIds.length
    if (imageIds.length < IMAGE_DB_BATCH) break
  }

  return { error: null, deletedCount }
}

async function adminClearImageDependentsForImageIds(
  sb: AdminClient,
  imageIds: string[]
): Promise<string | null> {
  for (let i = 0; i < imageIds.length; i += IMAGE_DB_BATCH) {
    const batch = imageIds.slice(i, i + IMAGE_DB_BATCH)
    const { error: selectionsError } = await sb
      .from('image_selections')
      .delete()
      .in('image_id', batch)
    if (selectionsError) return selectionsError.message

    const { error: logsError } = await sb
      .from('download_logs')
      .delete()
      .in('image_id', batch)
    if (logsError) return logsError.message
  }
  return null
}

export async function adminFetchImagesByAlbumId(
  albumId: string
): Promise<ImagesRow[]> {
  const sb = client()
  if (!sb) return []

  const { data, error } = await sb
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

export async function adminFetchImagesGroupedByAlbum(
  photographerId?: string | null
): Promise<Record<string, ImagesRow[]>> {
  const sb = client()
  if (!sb) return {}

  const pid = await scopedPhotographerId(photographerId)
  let albumIds: string[] | null = null

  if (pid) {
    const { data: albums } = await sb
      .from('albums')
      .select('id')
      .eq('photographer_id', pid)
    albumIds = (albums ?? []).map((a) => a.id)
    if (albumIds.length === 0) return {}
  }

  let query = sb
    .from('images')
    .select(
      'id, album_id, created_at, original_ext, image_url, thumbnail_url, status'
    )

  if (albumIds) {
    query = query.in('album_id', albumIds)
  }

  const { data, error } = await query.order('created_at', { ascending: true })

  if (error) return {}

  const map: Record<string, ImagesRow[]> = {}
  for (const img of data ?? []) {
    if (!map[img.album_id]) map[img.album_id] = []
    map[img.album_id].push(img)
  }
  return map
}

/** בחירות הלקוחות מקובצות לפי תמונה → { imageId: ['album','edit'] }. */
export async function adminFetchSelectionsByImage(
  photographerId?: string | null
): Promise<Record<string, string[]>> {
  const sb = client()
  if (!sb) return {}

  const pid = await scopedPhotographerId(photographerId)
  let imageIds: string[] | null = null

  if (pid) {
    const { data: albums } = await sb
      .from('albums')
      .select('id')
      .eq('photographer_id', pid)
    const albumIds = (albums ?? []).map((a) => a.id)
    if (albumIds.length === 0) return {}

    const { data: images } = await sb
      .from('images')
      .select('id')
      .in('album_id', albumIds)
    imageIds = (images ?? []).map((i) => i.id)
    if (imageIds.length === 0) return {}
  }

  let query = sb.from('image_selections').select('image_id, selection_type')

  if (imageIds) {
    query = query.in('image_id', imageIds)
  }

  const { data, error } = await query

  if (error) return {}

  const map: Record<string, string[]> = {}
  for (const row of data ?? []) {
    if (!row.selection_type) continue
    if (!map[row.image_id]) map[row.image_id] = []
    if (!map[row.image_id].includes(row.selection_type)) {
      map[row.image_id].push(row.selection_type)
    }
  }
  return map
}

export async function adminInsertImage(
  albumId: string,
  imageUrl: string,
  thumbnailUrl?: string | null
): Promise<{ error: string | null }> {
  const result = await adminInsertImagesBatch(albumId, [
    { imageUrl, thumbnailUrl },
  ])
  return { error: result.error }
}

const IMAGE_BATCH_MAX = 50

export async function adminInsertImagesBatch(
  albumId: string,
  items: { imageUrl: string; thumbnailUrl?: string | null }[]
): Promise<{ error: string | null; inserted: number }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', inserted: 0 }
  if (items.length === 0) return { error: null, inserted: 0 }
  if (items.length > IMAGE_BATCH_MAX) {
    return {
      error: `יותר מ-${IMAGE_BATCH_MAX} תמונות בבקשה אחת`,
      inserted: 0,
    }
  }

  const rows = items.map((item) => ({
    album_id: albumId,
    image_url: item.imageUrl,
    thumbnail_url: item.thumbnailUrl ?? item.imageUrl,
    status: 'ready' as const,
  }))

  let { error } = await sb.from('images').insert(rows)
  if (error?.message?.includes('status')) {
    const legacyRows = items.map((item) => ({
      album_id: albumId,
      image_url: item.imageUrl,
      thumbnail_url: item.thumbnailUrl ?? item.imageUrl,
    }))
    const fallback = await sb.from('images').insert(legacyRows)
    error = fallback.error
  }
  return { error: error?.message ?? null, inserted: error ? 0 : items.length }
}

export type ReservedGalleryImage = {
  id: string
  original_ext: string
}

/** שומר שורות תמונה לפני העלאה ל-R2 — בלי URL מלאים (חוסך egress). */
export async function adminReserveImagesBatch(
  albumId: string,
  items: { originalExt: string }[]
): Promise<{
  error: string | null
  reserved: ReservedGalleryImage[]
}> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', reserved: [] }
  if (items.length === 0) return { error: null, reserved: [] }
  if (items.length > IMAGE_BATCH_MAX) {
    return {
      error: `יותר מ-${IMAGE_BATCH_MAX} תמונות בבקשה אחת`,
      reserved: [],
    }
  }

  const rowsWithExt = items.map((item) => ({
    album_id: albumId,
    image_url: null,
    thumbnail_url: null,
    original_ext: item.originalExt,
    status: 'pending' as const,
  }))

  let data: { id: string; original_ext: string | null }[] | null = null
  let error: { message: string } | null = null

  const withExt = await sb
    .from('images')
    .insert(rowsWithExt)
    .select('id, original_ext')
  data = withExt.data
  error = withExt.error

  if (error?.message?.includes('original_ext') || error?.message?.includes('status')) {
    const rowsFallback = items.map((item) => ({
      album_id: albumId,
      image_url: null,
      thumbnail_url: null,
      original_ext: item.originalExt,
    }))
    const fallback = await sb.from('images').insert(rowsFallback).select('id, original_ext')
    data = fallback.data ?? null
    error = fallback.error
  }

  if (error) return { error: error.message, reserved: [] }

  const reserved = (data ?? []).map((row, index) => ({
    id: row.id,
    original_ext: row.original_ext ?? items[index]?.originalExt ?? 'jpg',
  }))
  return { error: null, reserved }
}

/** מסמן תמונות שהועלו ל-R2 כ-ready — רק שורות תחת album_id מאומת. */
export async function adminMarkImagesReady(
  albumId: string,
  imageIds: string[]
): Promise<{ error: string | null; updatedCount: number }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', updatedCount: 0 }
  if (imageIds.length === 0) return { error: null, updatedCount: 0 }

  const { data, error } = await sb
    .from('images')
    .update({ status: 'ready' })
    .eq('album_id', albumId)
    .in('id', imageIds)
    .select('id')

  if (error) return { error: error.message, updatedCount: 0 }
  return { error: null, updatedCount: data?.length ?? 0 }
}

export async function adminDeleteReservedImages(
  imageIds: string[]
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }
  if (imageIds.length === 0) return { error: null }

  const uniqueIds = [...new Set(imageIds.map((id) => id.trim()).filter(Boolean))]
  for (let i = 0; i < uniqueIds.length; i += IMAGE_DB_BATCH) {
    const batch = uniqueIds.slice(i, i + IMAGE_DB_BATCH)
    const { error } = await sb.from('images').delete().in('id', batch)
    if (error) return { error: error.message }
  }

  return { error: null }
}

/** מסמן תמונות כ-deleting לפני מחיקה — מוצג באדמין כ"מחיקה בתהליך". */
export async function adminMarkImagesDeleting(
  albumId: string,
  imageIds?: string[]
): Promise<{ error: string | null; markedCount: number }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', markedCount: 0 }

  const cleanAlbumId = albumId.trim()
  if (!cleanAlbumId) return { error: 'חסר מזהה גלריה', markedCount: 0 }

  let markedCount = 0

  if (imageIds?.length) {
    const uniqueIds = [
      ...new Set(imageIds.map((id) => id.trim()).filter(Boolean)),
    ]
    for (let i = 0; i < uniqueIds.length; i += IMAGE_DB_BATCH) {
      const batch = uniqueIds.slice(i, i + IMAGE_DB_BATCH)
      const { data, error } = await sb
        .from('images')
        .update({ status: 'deleting' })
        .eq('album_id', cleanAlbumId)
        .in('id', batch)
        .neq('status', 'deleting')
        .select('id')

      if (error) return { error: error.message, markedCount }
      markedCount += data?.length ?? 0
    }
    return { error: null, markedCount }
  }

  while (true) {
    const { data: page, error: selectError } = await sb
      .from('images')
      .select('id')
      .eq('album_id', cleanAlbumId)
      .neq('status', 'deleting')
      .limit(IMAGE_DB_BATCH)

    if (selectError) return { error: selectError.message, markedCount }

    const ids = page?.map((row) => row.id) ?? []
    if (ids.length === 0) break

    const { data, error } = await sb
      .from('images')
      .update({ status: 'deleting' })
      .in('id', ids)
      .select('id')

    if (error) return { error: error.message, markedCount }
    markedCount += data?.length ?? 0

    if (ids.length < IMAGE_DB_BATCH) break
  }

  return { error: null, markedCount }
}

export async function adminDeleteImage(
  imageId: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }

  const { data: image } = await sb
    .from('images')
    .select('album_id, image_url, thumbnail_url, original_ext')
    .eq('id', imageId)
    .maybeSingle()

  let photographerId: string | null = null
  if (image?.album_id) {
    const { data: album } = await sb
      .from('albums')
      .select('photographer_id')
      .eq('id', image.album_id)
      .maybeSingle()
    photographerId = album?.photographer_id ?? null
  }

  await sb.from('image_selections').delete().eq('image_id', imageId)
  await sb.from('download_logs').delete().eq('image_id', imageId)

  const { error } = await sb.from('images').delete().eq('id', imageId)
  if (error) return { error: error.message }

  const urls = new Set<string>()
  for (const url of [image?.image_url, image?.thumbnail_url]) {
    if (url) urls.add(url)
  }
  if (urls.size > 0) {
    void removeStoragePaths([...urls]).catch(() => {})
  } else if (image?.album_id) {
    const keys = [
      galleryThumbnailObjectKey(image.album_id, imageId, photographerId),
      galleryOriginalObjectKey(
        image.album_id,
        imageId,
        image.original_ext,
        photographerId
      ),
    ]
    void removeStoragePaths(keys.map((key) => r2PublicUrlFromKey(key))).catch(
      () => {}
    )
  }

  return { error: null }
}

/** מוחק מספר תמונות מגלריה (DB + R2). */
export async function adminBulkDeleteImagesByIds(
  albumId: string,
  imageIds: string[]
): Promise<{ error: string | null; deletedCount: number }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', deletedCount: 0 }

  const cleanAlbumId = albumId.trim()
  if (!cleanAlbumId) return { error: 'חסר מזהה גלריה', deletedCount: 0 }

  const uniqueIds = [
    ...new Set(imageIds.map((id) => id.trim()).filter(Boolean)),
  ]
  if (uniqueIds.length === 0) return { error: null, deletedCount: 0 }

  const { data: album } = await sb
    .from('albums')
    .select('photographer_id')
    .eq('id', cleanAlbumId)
    .maybeSingle()

  const photographerId = album?.photographer_id ?? null

  type ImageDeleteRow = Pick<
    ImagesRow,
    'id' | 'album_id' | 'image_url' | 'thumbnail_url' | 'original_ext'
  >

  const rows: ImageDeleteRow[] = []
  for (let i = 0; i < uniqueIds.length; i += IMAGE_DB_BATCH) {
    const batch = uniqueIds.slice(i, i + IMAGE_DB_BATCH)
    const { data, error } = await sb
      .from('images')
      .select('id, album_id, image_url, thumbnail_url, original_ext')
      .eq('album_id', cleanAlbumId)
      .in('id', batch)

    if (error) return { error: error.message, deletedCount: 0 }
    if (data?.length) rows.push(...data)
  }

  const depError = await adminClearImageDependentsForImageIds(sb, uniqueIds)
  if (depError) return { error: depError, deletedCount: 0 }

  for (let i = 0; i < uniqueIds.length; i += IMAGE_DB_BATCH) {
    const batch = uniqueIds.slice(i, i + IMAGE_DB_BATCH)
    const { error } = await sb.from('images').delete().in('id', batch)
    if (error) return { error: error.message, deletedCount: 0 }
  }

  const storageUrls = new Set<string>()
  for (const image of rows) {
    for (const url of [image.image_url, image.thumbnail_url]) {
      if (url?.trim()) storageUrls.add(url.trim())
    }
    if (!image.image_url?.trim() && !image.thumbnail_url?.trim()) {
      storageUrls.add(
        r2PublicUrlFromKey(
          galleryThumbnailObjectKey(cleanAlbumId, image.id, photographerId)
        )
      )
      storageUrls.add(
        r2PublicUrlFromKey(
          galleryOriginalObjectKey(
            cleanAlbumId,
            image.id,
            image.original_ext,
            photographerId
          )
        )
      )
    }
  }
  if (storageUrls.size > 0) {
    void removeStoragePaths([...storageUrls]).catch(() => {})
  }

  return { error: null, deletedCount: uniqueIds.length }
}

/** מוחק את כל תמונות הגלריה (האלבום נשאר). */
export async function adminDeleteAllAlbumImages(
  albumId: string
): Promise<{ error: string | null; deletedCount: number }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', deletedCount: 0 }

  const { count, error: countError } = await sb
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('album_id', albumId)
  if (countError) return { error: countError.message, deletedCount: 0 }
  const deletedCount = count ?? 0
  if (deletedCount === 0) return { error: null, deletedCount: 0 }

  const { error: dependentsError } = await adminClearImageDependentsForAlbum(
    sb,
    albumId
  )
  if (dependentsError) return { error: dependentsError, deletedCount: 0 }

  const { error: imagesError } = await sb
    .from('images')
    .delete()
    .eq('album_id', albumId)
  if (imagesError) return { error: imagesError.message, deletedCount: 0 }

  const { data: album } = await sb
    .from('albums')
    .select('cover_image, photographer_id')
    .eq('id', albumId)
    .maybeSingle()
  const clearCover = isAlbumOwnedCoverUrl(
    album?.cover_image,
    albumId,
    album?.photographer_id
  )

  if (album?.photographer_id) {
    void removeAlbumStorageFolder(albumId, album.photographer_id).catch(() => {})
  }

  if (clearCover) {
    await sb.from('albums').update({ cover_image: null }).eq('id', albumId)
  }

  return { error: null, deletedCount }
}

export type SiteSettingsPayload = {
  business_name: string
  tagline: string
  about_text: string
  about_headline_line1: string
  about_headline_line2: string
  about_quote: string
  phone: string
  email: string
  whatsapp: string
  years_experience: number
  total_clients: number
  total_projects: number
  primary_color: string
  secondary_color: string
  hero_image_url: string
  hero_image_url_mobile: string
  about_image_url: string
  logo_url: string
  theme_style: string
}

export function siteSettingsRowToPayload(
  row: SiteSettingsRow
): SiteSettingsPayload {
  return {
    business_name: row.business_name ?? '',
    tagline: row.tagline ?? '',
    about_text: row.about_text ?? '',
    about_headline_line1: row.about_headline_line1 ?? '',
    about_headline_line2: row.about_headline_line2 ?? '',
    about_quote: row.about_quote ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    whatsapp: row.whatsapp ?? '',
    years_experience: row.years_experience ?? 0,
    total_clients: row.total_clients ?? 0,
    total_projects: row.total_projects ?? 0,
    primary_color: row.primary_color ?? '',
    secondary_color: row.secondary_color ?? '',
    hero_image_url: row.hero_image_url ?? '',
    hero_image_url_mobile: row.hero_image_url_mobile ?? '',
    about_image_url: row.about_image_url ?? '',
    logo_url: row.logo_url ?? '',
    theme_style: row.theme_style ?? 'warm',
  }
}

export async function adminUpsertSiteSettings(
  id: string | null,
  payload: SiteSettingsPayload
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }

  const row = {
    business_name: payload.business_name || null,
    tagline: payload.tagline || null,
    about_text: payload.about_text || null,
    about_headline_line1: payload.about_headline_line1 || null,
    about_headline_line2: payload.about_headline_line2 || null,
    about_quote: payload.about_quote || null,
    phone: payload.phone || null,
    email: payload.email || null,
    whatsapp: payload.whatsapp || null,
    years_experience: payload.years_experience,
    total_clients: payload.total_clients,
    total_projects: payload.total_projects,
    primary_color: payload.primary_color || null,
    secondary_color: payload.secondary_color || null,
    hero_image_url: payload.hero_image_url || null,
    hero_image_url_mobile: payload.hero_image_url_mobile || null,
    about_image_url: payload.about_image_url || null,
    logo_url: payload.logo_url || null,
    theme_style: payload.theme_style || 'warm',
  }

  let targetId = id?.trim() || null
  if (!targetId) {
    targetId = await adminFindScopedSiteSettingsId()
  }

  if (targetId) {
    const { error } = await sb
      .from('site_settings')
      .update(row)
      .eq('id', targetId)
    return { error: error?.message ?? null }
  }

  const photographerId = await adminResolvePhotographerId()
  if (!photographerId) {
    return { error: 'לא נמצא צלם במערכת' }
  }

  const { error } = await sb
    .from('site_settings')
    .insert({ ...row, photographer_id: photographerId })
  return { error: error?.message ?? null }
}

/** מעדכן תמונת Hero (דסקטופ או מובייל) בשורת ההגדרות (יוצר שורה אם אין). */
export async function adminUpdateHeroImage(
  url: string,
  target: 'desktop' | 'mobile' = 'desktop'
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }

  const targetId = await adminFindScopedSiteSettingsId()

  if (targetId) {
    const { error } =
      target === 'mobile'
        ? await sb
            .from('site_settings')
            .update({ hero_image_url_mobile: url })
            .eq('id', targetId)
        : await sb
            .from('site_settings')
            .update({ hero_image_url: url })
            .eq('id', targetId)
    return { error: error?.message ?? null }
  }

  const photographerId = await adminResolvePhotographerId()
  if (!photographerId) return { error: 'לא נמצא צלם במערכת' }

  const { error } =
    target === 'mobile'
      ? await sb
          .from('site_settings')
          .insert({ hero_image_url_mobile: url, photographer_id: photographerId })
      : await sb
          .from('site_settings')
          .insert({ hero_image_url: url, photographer_id: photographerId })
  return { error: error?.message ?? null }
}

/** מעדכן רק את הלוגו בשורת ההגדרות (יוצר שורה אם אין). */
export async function adminUpdateLogoImage(
  url: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }

  const targetId = await adminFindScopedSiteSettingsId()

  if (targetId) {
    const { error } = await sb
      .from('site_settings')
      .update({ logo_url: url })
      .eq('id', targetId)
    return { error: error?.message ?? null }
  }

  const photographerId = await adminResolvePhotographerId()
  if (!photographerId) return { error: 'לא נמצא צלם במערכת' }

  const { error } = await sb
    .from('site_settings')
    .insert({ logo_url: url, photographer_id: photographerId })
  return { error: error?.message ?? null }
}

export type AlbumPayload = {
  client_id: string
  title: string
  cover_image: string
  status: string
  is_public: boolean
  expires_at: string
  max_album_selections: number | null
  max_edit_selections: number | null
}

export async function adminUpsertAlbum(
  id: string | null,
  payload: AlbumPayload
): Promise<{ error: string | null; id: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', id: null }

  const row = {
    client_id: payload.client_id,
    title: payload.title || null,
    cover_image: payload.cover_image || null,
    status: payload.status || 'draft',
    is_public: payload.is_public,
    expires_at: payload.expires_at ? new Date(payload.expires_at).toISOString() : null,
    max_album_selections: payload.max_album_selections,
    max_edit_selections: payload.max_edit_selections,
  }

  if (id) {
    const { error } = await sb.from('albums').update(row).eq('id', id)
    if (error) return { error: error.message, id }
    await ensureAlbumToken(id)
    return { error: null, id }
  }

  const { data: clientRow, error: clientError } = await sb
    .from('clients')
    .select('photographer_id')
    .eq('id', payload.client_id)
    .maybeSingle()
  if (clientError) return { error: clientError.message, id: null }
  if (!clientRow?.photographer_id) {
    return { error: 'ללקוח אין צלם משויך', id: null }
  }

  const { data, error } = await sb
    .from('albums')
    .insert({
      ...row,
      photographer_id: clientRow.photographer_id,
      access_token: randomBytes(18).toString('hex'),
    })
    .select('id')
    .single()
  return { error: error?.message ?? null, id: data?.id ?? null }
}

/** מוודא שלאלבום יש טוקן סודי (לקישור הישיר). */
export async function ensureAlbumToken(albumId: string): Promise<string | null> {
  const sb = client()
  if (!sb) return null

  const { data } = await sb
    .from('albums')
    .select('access_token')
    .eq('id', albumId)
    .maybeSingle()

  if (data?.access_token) return data.access_token

  const token = randomBytes(18).toString('hex')
  const { error } = await sb
    .from('albums')
    .update({ access_token: token })
    .eq('id', albumId)
  if (error) return null
  return token
}

export async function adminUpdateAlbumCover(
  albumId: string,
  coverUrl: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }

  const { error } = await sb
    .from('albums')
    .update({ cover_image: coverUrl })
    .eq('id', albumId)

  return { error: error?.message ?? null }
}

export async function adminDeleteAlbum(
  id: string
): Promise<{ error: string | null; deletedImageCount: number }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', deletedImageCount: 0 }

  const { error: imagesError, deletedCount } = await adminDeleteAllAlbumImages(id)
  if (imagesError) return { error: imagesError, deletedImageCount: 0 }

  const { error } = await sb.from('albums').delete().eq('id', id)
  if (error) return { error: error.message, deletedImageCount: deletedCount }

  return { error: null, deletedImageCount: deletedCount }
}

export type PackagePayload = {
  title: string
  price: number | null
  description: string
  features: string[]
  is_featured: boolean
  is_active: boolean
  sort_order: number
}

export async function adminFetchPackages(
  photographerId?: string | null
): Promise<PackagesRow[]> {
  const sb = client()
  if (!sb) return []

  const pid = await scopedPhotographerId(photographerId)
  let query = sb.from('packages').select('*')

  if (pid) {
    query = query.eq('photographer_id', pid)
  }

  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('admin packages:', error.message)
    return []
  }
  return data ?? []
}

export async function adminUpsertPackage(
  id: string | null,
  payload: PackagePayload
): Promise<{ error: string | null; id: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל', id: null }

  const row = {
    title: payload.title || null,
    price: payload.price,
    description: payload.description || null,
    features: payload.features.length > 0 ? payload.features : null,
    is_featured: payload.is_featured,
    is_active: payload.is_active,
    sort_order: payload.sort_order,
  }

  if (id) {
    const { error } = await sb.from('packages').update(row).eq('id', id)
    return { error: error?.message ?? null, id }
  }

  const photographerId = await adminResolvePhotographerId()
  if (!photographerId) return { error: 'לא נמצא צלם במערכת', id: null }

  const { data, error } = await sb
    .from('packages')
    .insert({ ...row, photographer_id: photographerId })
    .select('id')
    .single()
  return { error: error?.message ?? null, id: data?.id ?? null }
}

export async function adminDeletePackage(
  id: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }

  const { error } = await sb.from('packages').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export type ClientPayload = {
  full_name: string
  phone: string
  email: string
  access_code: string
}

export async function adminUpdateClient(
  clientId: string,
  userId: string,
  payload: ClientPayload
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }

  const { error: userError } = await sb
    .from('users')
    .update({
      email: payload.email.trim() || null,
      access_code: payload.access_code.trim() || null,
    })
    .eq('id', userId)

  if (userError) return { error: userError.message }

  const { error: clientError } = await sb
    .from('clients')
    .update({
      full_name: payload.full_name || null,
      phone: payload.phone || null,
    })
    .eq('id', clientId)

  return { error: clientError?.message ?? null }
}

export async function adminCreateClient(
  payload: ClientPayload
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }

  const email = payload.email.trim()
  if (!email) return { error: 'נדרש אימייל ללקוח' }

  const { data: user, error: userError } = await sb
    .from('users')
    .insert({
      email,
      role: 'client',
      access_code: payload.access_code.trim() || null,
    })
    .select('id')
    .single()

  if (userError) return { error: userError.message }

  const photographerId = await adminResolvePhotographerId()
  if (!photographerId) return { error: 'לא נמצא צלם במערכת' }

  const { error: clientError } = await sb.from('clients').insert({
    user_id: user.id,
    photographer_id: photographerId,
    full_name: payload.full_name || null,
    phone: payload.phone || null,
  })

  return { error: clientError?.message ?? null }
}

export async function adminDeleteClient(
  clientId: string,
  userId: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'אין חיבור מנהל' }

  const { count, error: albumsError } = await sb
    .from('albums')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)

  if (albumsError) return { error: albumsError.message }

  if (count && count > 0) {
    return { error: 'לא ניתן למחוק לקוח עם אלבומים קיימים. מחקו את האלבומים קודם.' }
  }

  const { error: clientError } = await sb.from('clients').delete().eq('id', clientId)
  if (clientError) return { error: clientError.message }

  const { error: userError } = await sb.from('users').delete().eq('id', userId)
  return { error: userError?.message ?? null }
}
