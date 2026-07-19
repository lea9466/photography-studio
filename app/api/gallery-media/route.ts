import { GetObjectCommand } from '@aws-sdk/client-s3'
import { downloadMediaObject } from '@/lib/r2/storage'
import { isR2Configured, getR2Config, r2PublicObjectUrl } from '@/lib/r2/config'
import { getR2Client } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasGallerySession } from '@/lib/gallery-session'
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

/** Keys safe to serve via public CDN — redirect instead of proxying bytes. */
const PUBLIC_REDIRECT_PREFIXES = [
  'previews/',
  'watermarked/',
  'branding/',
  'cover-images/',
] as const

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

function isPublicRedirectKey(key: string) {
  return PUBLIC_REDIRECT_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function redirectToPublicR2(normalizedKey: string): Response | null {
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

async function verifyGalleryAccess(galleryId: string): Promise<boolean> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('galleries')
    .select('id, is_public, gallery_type')
    .eq('id', galleryId)
    .single()

  if (!data) return false

  const gallery = data as { id: string; is_public: boolean; gallery_type: string }

  if (gallery.is_public && gallery.gallery_type === 'portfolio') {
    return true
  }

  return await hasGallerySession(galleryId)
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
) {
  const scoped = parseGalleryScopedPath(pathAfterBucket)
  const resolvedGalleryId = galleryIdParam || scoped?.galleryId

  if (!resolvedGalleryId) {
    return false
  }

  if (galleryIdParam && scoped?.galleryId && galleryIdParam !== scoped.galleryId) {
    return false
  }

  if (SENSITIVE_BUCKETS.has(bucket)) {
    const isOwner = await verifyPhotographerOwnsGallery(resolvedGalleryId)
    if (isOwner) return true
    return hasGallerySession(resolvedGalleryId)
  }

  return verifyGalleryAccess(resolvedGalleryId)
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

    if (GALLERY_SCOPED_BUCKETS.has(bucket)) {
      const allowed = isStudioDisplayMediaPath(path)
        ? await authorizeStudioDisplayMedia(bucket, path)
        : await authorizeGalleryScopedMedia(bucket, path, galleryId)
      if (!allowed) {
        return textResponse('גישה נדחתה', 403)
      }
    }

    if (isPublicRedirectKey(normalizedKey)) {
      const redirect = redirectToPublicR2(normalizedKey)
      if (redirect) return redirect
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
