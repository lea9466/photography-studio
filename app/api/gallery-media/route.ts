import { GetObjectCommand } from '@aws-sdk/client-s3'
import { downloadMediaObject } from '@/lib/r2/storage'
import { isR2Configured, getR2Config, r2PublicObjectUrl } from '@/lib/r2/config'
import { getR2Client } from '@/lib/r2/client'
import { signEdgeUrl } from '@/lib/r2/edge-signing'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { touchGallerySession } from '@/lib/gallery-session'
import type { MediaBucket } from '@/lib/r2/types'

const ALLOWED_PREFIXES = [
  'originals/',
  'previews/',
  'watermarked/',
  'edited/',
  'zips/',
  'branding/',
  'cover-images/',
] as const

/** Keys always safe to serve via public CDN, regardless of gallery privacy. */
const ALWAYS_PUBLIC_REDIRECT_PREFIXES = ['branding/', 'cover-images/'] as const

/**
 * Keys safe to redirect to the public CDN only when the gallery itself is
 * publicly accessible — for a private gallery these are the actual client
 * photos, so they must stream through this session-gated proxy instead of a
 * bare, tokenless public URL that would work for anyone who obtains it.
 */
const CONDITIONAL_PUBLIC_REDIRECT_PREFIXES = ['previews/', 'watermarked/'] as const

/**
 * Buckets the gallery-media-guard Worker requires a rolling `?exp&sig` on when
 * served from the public CDN domain (see lib/r2/edge-signing.ts). A bare,
 * unsigned CDN URL for these is rejected with 403 — so when this route
 * redirects such a key to the CDN it must hand back a signed URL, not a bare
 * one. branding/cover-images are served unsigned and are not in this set.
 */
const SIGNED_EDGE_REDIRECT_BUCKETS = new Set<MediaBucket>(['previews', 'watermarked'])

const GALLERY_SCOPED_BUCKETS = new Set<MediaBucket>([
  'originals',
  'previews',
  'watermarked',
  'edited',
  'zips',
])

const SENSITIVE_BUCKETS = new Set<MediaBucket>(['originals', 'edited', 'zips'])

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

function isAllowedGalleryMediaKey(key: string) {
  const normalized = key.replace(/^\/+/, '').trim()
  if (!normalized || normalized.includes('..')) return false
  return ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

function isAlwaysPublicRedirectKey(key: string) {
  return ALWAYS_PUBLIC_REDIRECT_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function isConditionalPublicRedirectKey(key: string) {
  return CONDITIONAL_PUBLIC_REDIRECT_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function redirectToPublicR2(normalizedKey: string): Response | null {
  const bucket = bucketFromKey(normalizedKey)
  if (bucket && SIGNED_EDGE_REDIRECT_BUCKETS.has(bucket)) {
    const { publicUrl } = getR2Config()
    if (!publicUrl) return null
    const path = normalizedKey.slice(normalizedKey.indexOf('/') + 1)
    return Response.redirect(signEdgeUrl(publicUrl, bucket, path), 302)
  }

  const publicUrl = r2PublicObjectUrl(normalizedKey)
  if (!publicUrl) return null
  return Response.redirect(publicUrl, 302)
}

function bucketFromKey(key: string): MediaBucket | null {
  const normalized = key.replace(/^\/+/, '')
  const prefix = normalized.split('/')[0]
  if (
    prefix === 'originals' ||
    prefix === 'previews' ||
    prefix === 'watermarked' ||
    prefix === 'edited' ||
    prefix === 'zips' ||
    prefix === 'branding'
  ) {
    return prefix
  }
  return null
}

function contentTypeFromKey(key: string) {
  const lower = key.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.mp4')) return 'video/mp4'
  return 'application/octet-stream'
}

function parseGalleryScopedPath(path: string) {
  const parts = path.split('/').filter(Boolean)
  if (parts.length < 2) return null
  return { userId: parts[0], galleryId: parts[1] }
}

/** Display-only media outside galleries: `{userId}/posts/...` or `{userId}/photo-edits/...` */
function isStudioDisplayMediaPath(pathAfterBucket: string) {
  const parts = pathAfterBucket.split('/').filter(Boolean)
  return parts.length >= 3 && (parts[1] === 'posts' || parts[1] === 'photo-edits')
}

async function authorizeStudioDisplayMedia(
  bucket: MediaBucket,
  pathAfterBucket: string
): Promise<boolean> {
  // Public display derivatives may be served like branding (CDN/proxy).
  if (bucket === 'previews' || bucket === 'watermarked') {
    return true
  }

  // Sensitive buckets still require the owning photographer session.
  const ownerId = pathAfterBucket.split('/').filter(Boolean)[0]
  if (!ownerId) return false

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id === ownerId
}

async function verifyGalleryAccess(
  galleryId: string
): Promise<{ allowed: boolean; publiclyAccessible: boolean }> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('galleries')
    .select('id, is_public, gallery_type')
    .eq('id', galleryId)
    .single()

  if (!data) return { allowed: false, publiclyAccessible: false }

  const gallery = data as { id: string; is_public: boolean; gallery_type: string }

  const publiclyAccessible = gallery.is_public && gallery.gallery_type === 'portfolio'
  if (publiclyAccessible) {
    return { allowed: true, publiclyAccessible: true }
  }

  return { allowed: await touchGallerySession(galleryId), publiclyAccessible: false }
}

async function verifyPhotographerOwnsGallery(galleryId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .eq('user_id', user.id)
    .maybeSingle()

  return !!data
}

async function authorizeGalleryScopedMedia(
  bucket: MediaBucket,
  pathAfterBucket: string,
  galleryIdParam: string
): Promise<{ allowed: boolean; publiclyAccessible: boolean }> {
  const scoped = parseGalleryScopedPath(pathAfterBucket)
  const resolvedGalleryId = galleryIdParam || scoped?.galleryId

  if (!resolvedGalleryId) {
    return { allowed: false, publiclyAccessible: false }
  }

  if (galleryIdParam && scoped?.galleryId && galleryIdParam !== scoped.galleryId) {
    return { allowed: false, publiclyAccessible: false }
  }

  if (SENSITIVE_BUCKETS.has(bucket)) {
    const isOwner = await verifyPhotographerOwnsGallery(resolvedGalleryId)
    if (isOwner) return { allowed: true, publiclyAccessible: false }
    return { allowed: await touchGallerySession(resolvedGalleryId), publiclyAccessible: false }
  }

  const access = await verifyGalleryAccess(resolvedGalleryId)
  if (access.allowed) return access

  // A non-public gallery with no visitor session — but the owning photographer
  // may still be pulling their own gallery's derivatives into the dashboard.
  // The testimonials image picker reads preview_url straight from the photos
  // table, so those <img> requests carry no galleryId param and no gallery-
  // session cookie, yet the logged-in photographer is plainly allowed to see
  // them. Stream the bytes (publiclyAccessible stays false) so a private
  // gallery's preview is never handed out as a bare, permanent public-CDN URL.
  if (await verifyPhotographerOwnsGallery(resolvedGalleryId)) {
    return { allowed: true, publiclyAccessible: false }
  }

  return access
}

async function streamCoverImage(normalizedKey: string) {
  const { bucketName } = getR2Config()
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: normalizedKey,
    })
  )

  if (!response.Body) {
    return textResponse('קובץ לא נמצא', 404)
  }

  const data = new Uint8Array(await response.Body.transformToByteArray())
  return new Response(Buffer.from(data), {
    headers: {
      'Content-Type': response.ContentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

async function streamVideo(normalizedKey: string, range: string | null) {
  const { bucketName } = getR2Config()
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: normalizedKey,
      ...(range ? { Range: range } : {}),
    })
  )
  if (!response.Body) return textResponse('קובץ לא נמצא', 404)

  const data = new Uint8Array(await response.Body.transformToByteArray())
  return new Response(Buffer.from(data), {
    status: response.ContentRange ? 206 : 200,
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(response.ContentLength ?? data.byteLength),
      'Accept-Ranges': 'bytes',
      ...(response.ContentRange ? { 'Content-Range': response.ContentRange } : {}),
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}

export async function GET(request: Request) {
  if (!isR2Configured()) {
    return textResponse('אחסון תמונות לא מוגדר', 503)
  }

  const key = new URL(request.url).searchParams.get('key')?.trim() ?? ''
  const galleryId = new URL(request.url).searchParams.get('galleryId')?.trim() ?? ''
  const normalizedKey = key.replace(/^\/+/, '')

  if (!isAllowedGalleryMediaKey(normalizedKey)) {
    return textResponse('לא נמצא', 404)
  }

  try {
    if (normalizedKey.startsWith('cover-images/')) {
      const redirect = redirectToPublicR2(normalizedKey)
      if (redirect) return redirect
      return streamCoverImage(normalizedKey)
    }

    const bucket = bucketFromKey(normalizedKey)
    if (!bucket) {
      return textResponse('לא נמצא', 404)
    }

    const path = normalizedKey.slice(normalizedKey.indexOf('/') + 1)

    let publiclyAccessible = false
    if (GALLERY_SCOPED_BUCKETS.has(bucket)) {
      if (isStudioDisplayMediaPath(path)) {
        const allowed = await authorizeStudioDisplayMedia(bucket, path)
        if (!allowed) return textResponse('גישה נדחתה', 403)
        publiclyAccessible = true
      } else {
        const result = await authorizeGalleryScopedMedia(bucket, path, galleryId)
        if (!result.allowed) return textResponse('גישה נדחתה', 403)
        publiclyAccessible = result.publiclyAccessible
      }
    }

    if (
      isAlwaysPublicRedirectKey(normalizedKey) ||
      (publiclyAccessible && isConditionalPublicRedirectKey(normalizedKey))
    ) {
      const redirect = redirectToPublicR2(normalizedKey)
      if (redirect) return redirect
    }

    if (normalizedKey.endsWith('.mp4')) {
      return streamVideo(normalizedKey, request.headers.get('range'))
    }

    const data = await downloadMediaObject(bucket, path)
    const cacheControl = normalizedKey.startsWith('branding/')
      ? 'private, no-cache, must-revalidate'
      : 'public, max-age=31536000, immutable'
    return new Response(Buffer.from(data), {
      headers: {
        'Content-Type': contentTypeFromKey(normalizedKey),
        'Cache-Control': cacheControl,
      },
    })
  } catch {
    return textResponse('קובץ לא נמצא', 404)
  }
}
