import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
  verifyImageIdsBelongToAlbum,
} from '@/lib/api-auth-helpers'
import {
  parseIsCompressed,
  r2BucketName,
  r2ConfigError,
  r2Configured,
  sanitizeGalleryId,
} from '@/lib/r2'
import { r2PublicConfigured } from '@/lib/r2-public'
import { createGalleryPresignedPutUrl } from '@/lib/r2-storage'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

type PresignBody = {
  galleryId?: string
  fileName?: string
  contentType?: string
  isCompressed?: boolean | string
  imageId?: string
  originalExt?: string
}

export async function POST(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json(
      { ok: false, message: adminConfigError() },
      { status: 503 }
    )
  }
  if (!r2Configured()) {
    return NextResponse.json(
      { ok: false, message: r2ConfigError() },
      { status: 503 }
    )
  }
  if (!r2PublicConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'חסר NEXT_PUBLIC_R2_PUBLIC_URL (או R2_PUBLIC_URL) — נדרש לקישורי תמונות ציבוריים',
      },
      { status: 503 }
    )
  }

  const bucket = r2BucketName()
  if (!bucket) {
    return NextResponse.json(
      { ok: false, message: 'חסר R2_BUCKET_NAME ב-.env.local' },
      { status: 503 }
    )
  }

  let body: PresignBody
  try {
    body = (await request.json()) as PresignBody
  } catch {
    return NextResponse.json(
      { ok: false, message: 'גוף הבקשה אינו JSON תקין' },
      { status: 400 }
    )
  }

  const galleryId = sanitizeGalleryId(String(body.galleryId ?? '').trim())
  if (!galleryId) {
    return NextResponse.json(
      {
        ok: false,
        message: 'חסר או לא תקין galleryId (אותיות, מספרים, _ ו-)',
      },
      { status: 400 }
    )
  }

  const fileName = String(body.fileName ?? '').trim()
  if (!fileName) {
    return NextResponse.json(
      { ok: false, message: 'חסר fileName' },
      { status: 400 }
    )
  }

  const contentType =
    String(body.contentType ?? '').trim() || 'application/octet-stream'
  const isCompressed = parseIsCompressed(
    body.isCompressed === undefined || body.isCompressed === null
      ? 'false'
      : String(body.isCompressed)
  )

  const imageId = String(body.imageId ?? '').trim()
  const originalExt = String(body.originalExt ?? '').trim()

  const auth = await requirePhotographerAlbumAccess(galleryId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  if (imageId) {
    const ownership = await verifyImageIdsBelongToAlbum(galleryId, [imageId])
    if (!ownership.ok) return adminAuthJsonResponse(ownership)
  }

  const { key, uploadUrl, url, error } = await createGalleryPresignedPutUrl(
    galleryId,
    auth.photographerId,
    fileName,
    contentType,
    isCompressed,
    imageId
      ? {
          imageId,
          originalExt: originalExt || undefined,
        }
      : undefined
  )

  if (error || !uploadUrl) {
    return NextResponse.json(
      { ok: false, message: error || 'שגיאה ביצירת קישור העלאה' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    key,
    uploadUrl,
    url,
    bucket,
    galleryId,
    isCompressed,
    expiresIn: 3600,
  })
}
