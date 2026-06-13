import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
  verifyImageIdsBelongToAlbum,
} from '@/lib/api-auth-helpers'
import { r2BucketName, r2ConfigError, r2Configured } from '@/lib/r2'
import { r2PublicConfigured } from '@/lib/r2-public'
import { createGalleryPresignedPutUrlBatch } from '@/lib/r2-storage'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

const BATCH_MAX = 50

type PresignBatchItem = {
  imageId?: string
  originalExt?: string
  contentType?: string
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'גוף הבקשה אינו JSON תקין' },
      { status: 400 }
    )
  }

  const record = body as Record<string, unknown>
  const albumId = String(record.album_id ?? record.galleryId ?? '').trim()
  const rawItems = record.items

  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר album_id' },
      { status: 400 }
    )
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'חסר מערך items' },
      { status: 400 }
    )
  }

  if (rawItems.length > BATCH_MAX) {
    return NextResponse.json(
      { ok: false, message: `מקסימום ${BATCH_MAX} תמונות בבקשה` },
      { status: 400 }
    )
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const items = rawItems.map((entry) => {
    const row = entry as PresignBatchItem
    return {
      imageId: String(row.imageId ?? '').trim(),
      originalExt: String(row.originalExt ?? '').trim(),
      contentType:
        String(row.contentType ?? '').trim() || 'application/octet-stream',
    }
  })

  for (const item of items) {
    if (!item.imageId || !item.originalExt) {
      return NextResponse.json(
        { ok: false, message: 'כל פריט חייב imageId ו-originalExt' },
        { status: 400 }
      )
    }
  }

  const imageIds = items.map((item) => item.imageId)
  const ownership = await verifyImageIdsBelongToAlbum(albumId, imageIds)
  if (!ownership.ok) return adminAuthJsonResponse(ownership)

  const { urls, error } = await createGalleryPresignedPutUrlBatch(
    albumId,
    auth.photographerId,
    items
  )

  if (error) {
    return NextResponse.json({ ok: false, message: error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    urls,
    bucket,
    albumId,
    expiresIn: 3600,
  })
}
