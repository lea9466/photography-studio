import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from 'npm:@aws-sdk/client-s3@3.1061.0'

const DB_BATCH = 100
const R2_BATCH = 1000
const DEPENDENTS_PAGE = 500

type BulkDeleteMode = 'images' | 'all' | 'album'

type BulkDeleteBody = {
  mode?: BulkDeleteMode
  albumId?: string
  imageIds?: string[]
  photographerId?: string
}

type ImageRow = {
  id: string
  album_id: string
  image_url: string | null
  thumbnail_url: string | null
  original_ext: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function isAuthorized(req: Request): boolean {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!serviceKey) return false
  const auth = req.headers.get('Authorization')?.trim() ?? ''
  return auth === `Bearer ${serviceKey}`
}

function sanitizeId(id: string): string | null {
  const trimmed = id.trim()
  if (!trimmed || !/^[\w-]+$/.test(trimmed)) return null
  return trimmed
}

function sanitizeExt(ext: string | null | undefined): string {
  const cleaned = String(ext ?? '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '')
    .replace(/[^a-z0-9]+/g, '')
  return cleaned || 'jpg'
}

function galleryPrefix(galleryId: string, photographerId?: string | null): string {
  const safeGallery = sanitizeId(galleryId)
  if (!safeGallery) return ''
  const safePhotographer = photographerId ? sanitizeId(photographerId) : null
  if (safePhotographer) {
    return `photographers/${safePhotographer}/galleries/${safeGallery}`
  }
  return `galleries/${safeGallery}`
}

function deterministicKey(
  galleryId: string,
  imageId: string,
  kind: 'original' | 'thumbnail',
  originalExt?: string | null,
  photographerId?: string | null
): string {
  const prefix = galleryPrefix(galleryId, photographerId)
  const safeImage = sanitizeId(imageId)
  if (!prefix || !safeImage) return ''
  if (kind === 'thumbnail') return `${prefix}/thumbnails/${safeImage}.webp`
  return `${prefix}/originals/${safeImage}.${sanitizeExt(originalExt)}`
}

function r2PublicBase(): string {
  for (const key of ['NEXT_PUBLIC_R2_PUBLIC_URL', 'R2_PUBLIC_URL', 'NEXT_PUBLIC_R2_BASE_URL']) {
    const trimmed = Deno.env.get(key)?.trim()
    if (trimmed) return trimmed.replace(/\/+$/, '')
  }
  return ''
}

function keyFromPublicUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const base = r2PublicBase()
  if (base && trimmed.startsWith(`${base}/`)) {
    return trimmed.slice(base.length + 1)
  }
  const photographersIndex = trimmed.indexOf('photographers/')
  if (photographersIndex >= 0) return trimmed.slice(photographersIndex)
  const galleriesIndex = trimmed.indexOf('galleries/')
  if (galleriesIndex >= 0) return trimmed.slice(galleriesIndex)
  return null
}

function isAlbumOwnedCoverUrl(
  coverImage: string | null | undefined,
  albumId: string,
  photographerId?: string | null
): boolean {
  const url = coverImage?.trim()
  if (!url) return false
  if (
    photographerId &&
    url.includes(`photographers/${photographerId}/galleries/${albumId}/covers/`)
  ) {
    return true
  }
  if (url.includes(`galleries/${albumId}/covers/`)) return true
  if (url.includes('res.cloudinary.com') && url.includes(`gallery/${albumId}/`)) {
    return true
  }
  return false
}

function r2Client(): S3Client | null {
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')?.trim()
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')?.trim()
  const endpoint = Deno.env.get('R2_ENDPOINT')?.trim()
  if (!accessKeyId || !secretAccessKey || !endpoint) return null

  const withProtocol = endpoint.startsWith('http') ? endpoint : `https://${endpoint}`
  let origin = withProtocol
  try {
    origin = new URL(withProtocol).origin
  } catch {
    origin = withProtocol.replace(/\/+$/, '')
  }

  return new S3Client({
    region: 'auto',
    endpoint: origin,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function r2Bucket(): string | null {
  return Deno.env.get('R2_BUCKET_NAME')?.trim() || null
}

async function deleteR2Keys(keys: string[]): Promise<void> {
  const bucket = r2Bucket()
  const client = r2Client()
  if (!bucket || !client || keys.length === 0) return

  const unique = [...new Set(keys.filter(Boolean))]
  for (let i = 0; i < unique.length; i += R2_BATCH) {
    const chunk = unique.slice(i, i + R2_BATCH)
    try {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: chunk.map((Key) => ({ Key })) },
        })
      )
    } catch (err) {
      console.error('R2 delete chunk failed:', err)
    }
  }
}

async function deleteR2GalleryFolder(
  galleryId: string,
  photographerId?: string | null
): Promise<void> {
  const bucket = r2Bucket()
  const client = r2Client()
  if (!bucket || !client) return

  const safeGallery = sanitizeId(galleryId)
  const safePhotographer = photographerId ? sanitizeId(photographerId) : null
  if (!safeGallery) return

  const prefixes = safePhotographer
    ? [
        `photographers/${safePhotographer}/galleries/${safeGallery}/`,
        `galleries/${safeGallery}/`,
      ]
    : [`galleries/${safeGallery}/`]

  for (const prefix of prefixes) {
    let continuationToken: string | undefined
    do {
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      )
      const keys =
        list.Contents?.map((item) => item.Key).filter((key): key is string => !!key) ?? []
      if (keys.length > 0) await deleteR2Keys(keys)
      continuationToken = list.NextContinuationToken
    } while (continuationToken)
  }
}

function collectR2KeysForImages(
  images: ImageRow[],
  photographerId?: string | null
): string[] {
  const keys: string[] = []
  for (const image of images) {
    for (const url of [image.image_url, image.thumbnail_url]) {
      if (url) {
        const key = keyFromPublicUrl(url)
        if (key) keys.push(key)
      }
    }
    if (!image.image_url?.trim() && !image.thumbnail_url?.trim()) {
      keys.push(
        deterministicKey(image.album_id, image.id, 'thumbnail', undefined, photographerId),
        deterministicKey(
          image.album_id,
          image.id,
          'original',
          image.original_ext,
          photographerId
        )
      )
    }
  }
  return keys.filter(Boolean)
}

async function clearDependentsForImageIds(
  sb: ReturnType<typeof createClient>,
  imageIds: string[]
): Promise<string | null> {
  for (let i = 0; i < imageIds.length; i += DB_BATCH) {
    const batch = imageIds.slice(i, i + DB_BATCH)
    const { error: selectionsError } = await sb
      .from('image_selections')
      .delete()
      .in('image_id', batch)
    if (selectionsError) return selectionsError.message

    const { error: logsError } = await sb.from('download_logs').delete().in('image_id', batch)
    if (logsError) return logsError.message
  }
  return null
}

async function clearDependentsForAlbum(
  sb: ReturnType<typeof createClient>,
  albumId: string
): Promise<string | null> {
  let from = 0
  while (true) {
    const { data: page, error: selectError } = await sb
      .from('images')
      .select('id')
      .eq('album_id', albumId)
      .range(from, from + DEPENDENTS_PAGE - 1)

    if (selectError) return selectError.message

    const imageIds = page?.map((row) => row.id) ?? []
    if (imageIds.length === 0) break

    const depError = await clearDependentsForImageIds(sb, imageIds)
    if (depError) return depError

    if (imageIds.length < DEPENDENTS_PAGE) break
    from += DEPENDENTS_PAGE
  }
  return null
}

async function deleteImagesByIds(
  sb: ReturnType<typeof createClient>,
  albumId: string,
  imageIds: string[],
  photographerId?: string | null
): Promise<{ error: string | null; deletedCount: number }> {
  const uniqueIds = [...new Set(imageIds.map((id) => id.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) return { error: null, deletedCount: 0 }

  const allRows: ImageRow[] = []
  for (let i = 0; i < uniqueIds.length; i += DB_BATCH) {
    const batch = uniqueIds.slice(i, i + DB_BATCH)
    const { data, error } = await sb
      .from('images')
      .select('id, album_id, image_url, thumbnail_url, original_ext')
      .eq('album_id', albumId)
      .in('id', batch)

    if (error) return { error: error.message, deletedCount: 0 }
    if (data?.length) allRows.push(...(data as ImageRow[]))
  }

  const depError = await clearDependentsForImageIds(sb, uniqueIds)
  if (depError) return { error: depError, deletedCount: 0 }

  for (let i = 0; i < uniqueIds.length; i += DB_BATCH) {
    const batch = uniqueIds.slice(i, i + DB_BATCH)
    const { error } = await sb.from('images').delete().in('id', batch)
    if (error) return { error: error.message, deletedCount: 0 }
  }

  const r2Keys = collectR2KeysForImages(allRows, photographerId)
  await deleteR2Keys(r2Keys)

  return { error: null, deletedCount: uniqueIds.length }
}

async function deleteAllAlbumImages(
  sb: ReturnType<typeof createClient>,
  albumId: string,
  photographerId?: string | null
): Promise<{ error: string | null; deletedCount: number }> {
  const { count, error: countError } = await sb
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('album_id', albumId)

  if (countError) return { error: countError.message, deletedCount: 0 }
  const deletedCount = count ?? 0
  if (deletedCount === 0) return { error: null, deletedCount: 0 }

  const depError = await clearDependentsForAlbum(sb, albumId)
  if (depError) return { error: depError, deletedCount: 0 }

  const { error: imagesError } = await sb.from('images').delete().eq('album_id', albumId)
  if (imagesError) return { error: imagesError.message, deletedCount: 0 }

  const { data: album } = await sb
    .from('albums')
    .select('cover_image, photographer_id')
    .eq('id', albumId)
    .maybeSingle()

  const resolvedPhotographerId = photographerId ?? album?.photographer_id ?? null
  if (resolvedPhotographerId) {
    await deleteR2GalleryFolder(albumId, resolvedPhotographerId)
  }

  const clearCover = isAlbumOwnedCoverUrl(
    album?.cover_image,
    albumId,
    resolvedPhotographerId
  )
  if (clearCover) {
    await sb.from('albums').update({ cover_image: null }).eq('id', albumId)
  }

  return { error: null, deletedCount }
}

async function runBulkDelete(body: BulkDeleteBody): Promise<void> {
  const sb = adminClient()
  if (!sb) {
    console.error('bulk-delete-images: missing Supabase admin client')
    return
  }

  const albumId = body.albumId?.trim() ?? ''
  const mode = body.mode ?? 'images'
  const photographerId = body.photographerId?.trim() || undefined

  if (!albumId) {
    console.error('bulk-delete-images: missing albumId')
    return
  }

  const { data: album, error: albumError } = await sb
    .from('albums')
    .select('id, photographer_id')
    .eq('id', albumId)
    .maybeSingle()

  if (albumError || !album) {
    console.error('bulk-delete-images: album not found', albumError?.message)
    return
  }

  if (photographerId && album.photographer_id !== photographerId) {
    console.error('bulk-delete-images: photographer scope mismatch')
    return
  }

  const resolvedPhotographerId = photographerId ?? album.photographer_id ?? undefined

  if (mode === 'all') {
    const { error, deletedCount } = await deleteAllAlbumImages(
      sb,
      albumId,
      resolvedPhotographerId
    )
    if (error) console.error('bulk-delete-images all:', error)
    else console.log(`bulk-delete-images: deleted ${deletedCount} images from album ${albumId}`)
    return
  }

  if (mode === 'album') {
    const { error, deletedCount } = await deleteAllAlbumImages(
      sb,
      albumId,
      resolvedPhotographerId
    )
    if (error) {
      console.error('bulk-delete-images album images:', error)
      return
    }
    console.log(`bulk-delete-images: deleted ${deletedCount} images before album delete`)

    const { error: albumDeleteError } = await sb.from('albums').delete().eq('id', albumId)
    if (albumDeleteError) {
      console.error('bulk-delete-images album row:', albumDeleteError.message)
    } else {
      console.log(`bulk-delete-images: deleted album ${albumId}`)
    }
    return
  }

  const imageIds = body.imageIds ?? []
  const { error, deletedCount } = await deleteImagesByIds(
    sb,
    albumId,
    imageIds,
    resolvedPhotographerId
  )
  if (error) console.error('bulk-delete-images images:', error)
  else console.log(`bulk-delete-images: deleted ${deletedCount} images from album ${albumId}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405)
  }

  if (!isAuthorized(req)) {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401)
  }

  let body: BulkDeleteBody
  try {
    body = (await req.json()) as BulkDeleteBody
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400)
  }

  const mode = body.mode ?? 'images'
  if (mode !== 'images' && mode !== 'all' && mode !== 'album') {
    return jsonResponse({ ok: false, error: 'Invalid mode' }, 400)
  }

  if (!body.albumId?.trim()) {
    return jsonResponse({ ok: false, error: 'Missing albumId' }, 400)
  }

  if (mode === 'images') {
    const ids = (body.imageIds ?? []).map((id) => id.trim()).filter(Boolean)
    if (ids.length === 0) {
      return jsonResponse({ ok: false, error: 'Missing imageIds' }, 400)
    }
    if (ids.length > 10_000) {
      return jsonResponse({ ok: false, error: 'Too many imageIds' }, 400)
    }
  }

  const work = runBulkDelete(body)
  // @ts-expect-error EdgeRuntime is injected by Supabase
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    // @ts-expect-error EdgeRuntime is injected by Supabase
    EdgeRuntime.waitUntil(work)
  } else {
    await work
  }

  return jsonResponse({ ok: true, queued: true }, 202)
})
