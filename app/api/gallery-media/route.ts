import { GetObjectCommand } from '@aws-sdk/client-s3'
import { downloadMediaObject } from '@/lib/r2/storage'
import { isR2Configured, getR2Config } from '@/lib/r2/config'
import { getR2Client } from '@/lib/r2/client'
import type { MediaBucket } from '@/lib/r2/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasGallerySession } from '@/lib/gallery-session'

const ALLOWED_PREFIXES = [
  'originals/',
  'previews/',
  'watermarked/',
  'edited/',
  'zips/',
  'branding/',
  'cover-images/',
] as const

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

    const bucket = bucketFromKey(normalizedKey)
    if (!bucket) {
      return textResponse('לא נמצא', 404)
    }

    if (galleryId) {
      const hasAccess = await verifyGalleryAccess(galleryId)
      if (!hasAccess) {
        return textResponse('גישה נדחתה', 403)
      }
    }

    const path = normalizedKey.slice(normalizedKey.indexOf('/') + 1)
    const data = await downloadMediaObject(bucket, path)
    return new Response(Buffer.from(data), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return textResponse('קובץ לא נמצא', 404)
  }
}
