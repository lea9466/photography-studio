import { randomBytes } from 'crypto'
import { getAdminClient } from '@/lib/supabase-admin'
import type { AlbumsRow, ImagesRow, SelectionType } from '@/lib/database.types'

/**
 * שכבת נתונים לאזור הלקוח (שרת בלבד).
 * כל הגישה עוברת דרך service-role, עם בקרת גישה משלנו:
 * סשן לקוח חתום (התחברות אימייל+קוד) או טוקן סודי של אלבום.
 */

export type ClientAlbumPreview = AlbumsRow & { image_count: number }

export type AlbumWithImages = AlbumsRow & {
  images: ImagesRow[]
  client_id: string
}

/** אלבום לתצוגת לקוח — עמוד ראשון + מטא-דאטה ל-pagination */
export type ClientAlbumView = AlbumsRow & {
  client_id: string
  images: ImagesRow[]
  nextCursor: string | null
  totalCount: number
}

export const ALBUM_IMAGES_PAGE_SIZE = 50

export type AlbumImageCursor = { created_at: string; id: string }

export function encodeAlbumImageCursor(cursor: AlbumImageCursor): string {
  return `${cursor.created_at}|${cursor.id}`
}

export function decodeAlbumImageCursor(
  raw: string | null | undefined
): AlbumImageCursor | null {
  if (!raw?.trim()) return null
  const sep = raw.indexOf('|')
  if (sep < 0) return null
  const created_at = raw.slice(0, sep)
  const id = raw.slice(sep + 1)
  if (!created_at || !id) return null
  return { created_at, id }
}

export type SelectionMap = Record<string, SelectionType[]>

export const SELECTION_TYPES: SelectionType[] = ['album', 'edit']

export function generateAlbumToken(): string {
  return randomBytes(18).toString('hex')
}

export function isAlbumExpired(album: Pick<AlbumsRow, 'status' | 'expires_at'>): boolean {
  if (album.status === 'expired') return true
  if (album.expires_at) {
    const t = new Date(album.expires_at).getTime()
    if (!Number.isNaN(t) && t < Date.now()) return true
  }
  return false
}

/** התחברות: אימייל + קוד גישה → מזהה לקוח (או null). */
export async function clientLogin(
  email: string,
  code: string
): Promise<string | null> {
  const sb = getAdminClient()
  if (!sb) return null

  const cleanEmail = email.trim()
  const cleanCode = code.trim()
  if (!cleanEmail || !cleanCode) return null

  const { data: user } = await sb
    .from('users')
    .select('id, access_code')
    .ilike('email', cleanEmail)
    .limit(1)
    .maybeSingle()

  if (!user || !user.access_code) return null
  if (user.access_code.trim() !== cleanCode) return null

  const { data: client } = await sb
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!client) return null

  return client.id
}

/** האם הלקוח שייך לצלם הזה — לזיהוי סשן לקוח באתר ה-tenant הנכון. */
export async function clientBelongsToPhotographer(
  clientId: string,
  photographerId: string
): Promise<boolean> {
  const sb = getAdminClient()
  if (!sb) return false
  const { data } = await sb
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('photographer_id', photographerId)
    .maybeSingle()
  return Boolean(data)
}

export async function fetchClientName(clientId: string): Promise<string | null> {
  const sb = getAdminClient()
  if (!sb) return null
  const { data } = await sb
    .from('clients')
    .select('full_name')
    .eq('id', clientId)
    .maybeSingle()
  return data?.full_name ?? null
}

/** רשימת אלבומים של לקוח עם מספר תמונות. */
export async function fetchClientAlbums(
  clientId: string
): Promise<ClientAlbumPreview[]> {
  const sb = getAdminClient()
  if (!sb) return []

  const { data: albums, error } = await sb
    .from('albums')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error || !albums?.length) return []

  const ids = albums.map((a) => a.id)
  const { data: images } = await sb
    .from('images')
    .select('album_id')
    .in('album_id', ids)
    .eq('status', 'ready')

  const counts = new Map<string, number>()
  for (const img of images ?? []) {
    counts.set(img.album_id, (counts.get(img.album_id) ?? 0) + 1)
  }

  return albums.map((a) => ({ ...a, image_count: counts.get(a.id) ?? 0 }))
}

const ALBUM_IMAGE_SELECT = 'id, album_id, created_at, original_ext, status'

/** Keyset pagination — מיון עולה (ישן → חדש), cursor מורכב מ-created_at + id. */
export async function fetchAlbumImagesPaginated(
  albumId: string,
  cursor: AlbumImageCursor | null = null,
  pageSize: number = ALBUM_IMAGES_PAGE_SIZE
): Promise<{
  images: ImagesRow[]
  nextCursor: AlbumImageCursor | null
  error: string | null
}> {
  const sb = getAdminClient()
  if (!sb) return { images: [], nextCursor: null, error: 'אין חיבור' }

  let query = sb
    .from('images')
    .select(ALBUM_IMAGE_SELECT)
    .eq('album_id', albumId)
    .eq('status', 'ready')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (cursor) {
    const ts = cursor.created_at.replace(/"/g, '\\"')
    const id = cursor.id.replace(/"/g, '\\"')
    query = query.or(
      `created_at.gt."${ts}",and(created_at.eq."${ts}",id.gt."${id}")`
    )
  }

  const { data, error } = await query.limit(pageSize)
  if (error) return { images: [], nextCursor: null, error: error.message }

  const images = (data ?? []) as ImagesRow[]
  const last = images[images.length - 1]
  const nextCursor =
    last && images.length === pageSize && last.created_at
      ? { created_at: last.created_at, id: last.id }
      : null

  return { images, nextCursor, error: null }
}

export async function fetchAlbumReadyImageCount(albumId: string): Promise<number> {
  const sb = getAdminClient()
  if (!sb) return 0
  const { count, error } = await sb
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('album_id', albumId)
    .eq('status', 'ready')
  if (error) return 0
  return count ?? 0
}

/** כל תמונות האלבום — למסלולי ZIP / הורדה (לא לתצוגה ראשונית). */
export async function fetchAllAlbumImages(albumId: string): Promise<ImagesRow[]> {
  const sb = getAdminClient()
  if (!sb) return []
  const { data } = await sb
    .from('images')
    .select(ALBUM_IMAGE_SELECT)
    .eq('album_id', albumId)
    .eq('status', 'ready')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
  return (data ?? []) as ImagesRow[]
}

async function buildClientAlbumView(
  album: AlbumsRow,
  pageSize: number = ALBUM_IMAGES_PAGE_SIZE
): Promise<ClientAlbumView> {
  const [page, totalCount] = await Promise.all([
    fetchAlbumImagesPaginated(album.id, null, pageSize),
    fetchAlbumReadyImageCount(album.id),
  ])
  return {
    ...album,
    client_id: album.client_id,
    images: page.images,
    nextCursor: page.nextCursor ? encodeAlbumImageCursor(page.nextCursor) : null,
    totalCount,
  }
}

/** אלבום + תמונות, מאומת שהוא שייך ללקוח. */
export async function fetchAlbumForClient(
  clientId: string,
  albumId: string
): Promise<AlbumWithImages | null> {
  const sb = getAdminClient()
  if (!sb) return null

  const { data: album } = await sb
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!album) return null
  return { ...album, images: [], client_id: album.client_id }
}

/** אלבום + עמוד ראשון לתצוגה (pagination). */
export async function fetchClientAlbumView(
  clientId: string,
  albumId: string,
  pageSize: number = ALBUM_IMAGES_PAGE_SIZE
): Promise<ClientAlbumView | null> {
  const sb = getAdminClient()
  if (!sb) return null

  const { data: album } = await sb
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!album) return null
  return buildClientAlbumView(album, pageSize)
}

/** אלבום + תמונות לפי טוקן סודי (קישור ישיר, ללא התחברות). */
export async function fetchAlbumByToken(
  token: string
): Promise<AlbumWithImages | null> {
  const sb = getAdminClient()
  if (!sb) return null

  const clean = token.trim()
  if (!clean) return null

  const { data: album } = await sb
    .from('albums')
    .select('*')
    .eq('access_token', clean)
    .maybeSingle()

  if (!album) return null
  return { ...album, images: [], client_id: album.client_id }
}

/** אלבום + עמוד ראשון לפי טוקן סודי. */
export async function fetchAlbumViewByToken(
  token: string,
  pageSize: number = ALBUM_IMAGES_PAGE_SIZE
): Promise<ClientAlbumView | null> {
  const sb = getAdminClient()
  if (!sb) return null

  const clean = token.trim()
  if (!clean) return null

  const { data: album } = await sb
    .from('albums')
    .select('*')
    .eq('access_token', clean)
    .maybeSingle()

  if (!album) return null
  return buildClientAlbumView(album, pageSize)
}

/** בחירות הלקוח עבור קבוצת תמונות → מפה של imageId → סוגים. */
export async function fetchSelectionMap(
  clientId: string,
  imageIds: string[]
): Promise<SelectionMap> {
  const sb = getAdminClient()
  if (!sb || imageIds.length === 0) return {}

  const { data } = await sb
    .from('image_selections')
    .select('image_id, selection_type')
    .eq('client_id', clientId)
    .in('image_id', imageIds)

  const map: SelectionMap = {}
  for (const row of data ?? []) {
    if (!row.selection_type) continue
    if (!map[row.image_id]) map[row.image_id] = []
    map[row.image_id].push(row.selection_type)
  }
  return map
}

/** כל בחירות הלקוח באלבום (join דרך images) — בלי לשלוף את כל מזהי התמונות. */
export async function fetchSelectionMapForAlbum(
  clientId: string,
  albumId: string
): Promise<SelectionMap> {
  const sb = getAdminClient()
  if (!sb) return {}

  const { data } = await sb
    .from('image_selections')
    .select('image_id, selection_type, images!inner(album_id)')
    .eq('client_id', clientId)
    .eq('images.album_id', albumId)

  const map: SelectionMap = {}
  for (const row of data ?? []) {
    if (!row.selection_type) continue
    if (!map[row.image_id]) map[row.image_id] = []
    map[row.image_id].push(row.selection_type)
  }
  return map
}

/** האם ללקוח יש בחירה מסוג מסוים לתמונה. */
export async function hasSelection(
  clientId: string,
  imageId: string,
  type: SelectionType
): Promise<boolean> {
  const sb = getAdminClient()
  if (!sb) return false

  const { data } = await sb
    .from('image_selections')
    .select('id')
    .eq('client_id', clientId)
    .eq('image_id', imageId)
    .eq('selection_type', type)
    .maybeSingle()

  return !!data
}

/** ספירת בחירות לפי סוג באלבום (join דרך images). */
export async function countAlbumSelectionsByType(
  clientId: string,
  albumId: string,
  type: 'album' | 'edit'
): Promise<number> {
  const sb = getAdminClient()
  if (!sb) return 0

  const { count, error } = await sb
    .from('image_selections')
    .select('id, images!inner(album_id)', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('selection_type', type)
    .eq('images.album_id', albumId)

  if (error) return 0
  return count ?? 0
}

/** הוספה/הסרה של בחירה. מחזיר האם נבחר עכשיו. */
export async function toggleSelection(
  clientId: string,
  imageId: string,
  type: SelectionType
): Promise<{ selected: boolean; error: string | null }> {
  const sb = getAdminClient()
  if (!sb) return { selected: false, error: 'אין חיבור' }

  const { data: existing } = await sb
    .from('image_selections')
    .select('id')
    .eq('client_id', clientId)
    .eq('image_id', imageId)
    .eq('selection_type', type)
    .maybeSingle()

  if (existing) {
    const { error } = await sb
      .from('image_selections')
      .delete()
      .eq('id', existing.id)
    return { selected: false, error: error?.message ?? null }
  }

  const { error } = await sb.from('image_selections').insert({
    client_id: clientId,
    image_id: imageId,
    selection_type: type,
  })
  return { selected: !error, error: error?.message ?? null }
}

export type DesiredSelection = { imageId: string; type: SelectionType }

/**
 * שמירה מרוכזת של כל הבחירות לאלבום (כפתור "שמור שינויים").
 * מוחק את כל הבחירות הקיימות של הלקוח עבור תמונות האלבום, ומכניס את הסט החדש.
 */
export async function saveSelections(
  clientId: string,
  albumId: string,
  desired: DesiredSelection[]
): Promise<{ error: string | null }> {
  const sb = getAdminClient()
  if (!sb) return { error: 'אין חיבור' }

  const { data: existing, error: fetchError } = await sb
    .from('image_selections')
    .select('id, images!inner(album_id)')
    .eq('client_id', clientId)
    .eq('images.album_id', albumId)

  if (fetchError) return { error: fetchError.message }

  const existingIds = (existing ?? []).map((row) => row.id)
  if (existingIds.length > 0) {
    const { error: delError } = await sb
      .from('image_selections')
      .delete()
      .in('id', existingIds)
    if (delError) return { error: delError.message }
  }

  if (desired.length === 0) return { error: null }

  const rows = desired.map((d) => ({
    client_id: clientId,
    image_id: d.imageId,
    selection_type: d.type,
  }))
  const { error: insError } = await sb.from('image_selections').insert(rows)
  return { error: insError?.message ?? null }
}

/** מאמת שכל מזהי התמונות שייכים לאלבום (שאילתה אחת, לא טעינת כל האלבום). */
export async function verifyImageIdsInAlbum(
  albumId: string,
  imageIds: string[]
): Promise<boolean> {
  const sb = getAdminClient()
  if (!sb) return false
  const unique = [...new Set(imageIds)]
  if (unique.length === 0) return true

  const { data, error } = await sb
    .from('images')
    .select('id')
    .eq('album_id', albumId)
    .in('id', unique)

  if (error) return false
  return (data?.length ?? 0) === unique.length
}

/** מסמן את רגע אישור הבחירות (selections_submitted_at). מחזיר את החותמת. */
export async function markSelectionsSubmitted(
  albumId: string
): Promise<string | null> {
  const sb = getAdminClient()
  if (!sb) return null
  const now = new Date().toISOString()
  const { error } = await sb
    .from('albums')
    .update({ selections_submitted_at: now })
    .eq('id', albumId)
  return error ? null : now
}

/** מאמת שתמונה שייכת לאלבום נתון. */
export async function imageBelongsToAlbum(
  imageId: string,
  albumId: string
): Promise<boolean> {
  const sb = getAdminClient()
  if (!sb) return false
  const { data } = await sb
    .from('images')
    .select('id')
    .eq('id', imageId)
    .eq('album_id', albumId)
    .maybeSingle()
  return !!data
}

/** רישום הורדות (לא חוסם אם נכשל). */
export async function logDownloads(
  clientId: string,
  imageIds: string[]
): Promise<void> {
  const sb = getAdminClient()
  if (!sb || imageIds.length === 0) return
  const rows = imageIds.map((image_id) => ({ client_id: clientId, image_id }))
  await sb.from('download_logs').insert(rows)
}
