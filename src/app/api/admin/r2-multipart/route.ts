import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
  verifyImageIdsBelongToAlbum,
} from '@/lib/api-auth-helpers'
import type { GalleryMultipartPart } from '@/lib/r2-storage'
import {
  abortGalleryMultipartUpload,
  completeGalleryMultipartUpload,
  createGalleryMultipartPartUrl,
  createGalleryMultipartUpload,
} from '@/lib/r2-storage'
import { r2ConfigError, r2Configured } from '@/lib/r2'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

type MultipartAction = 'init' | 'get-part-url' | 'complete' | 'abort'

type MultipartPartInput = {
  ETag?: string
  PartNumber?: number
}

function parseMultipartParts(raw: unknown): GalleryMultipartPart[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null

  const parts: GalleryMultipartPart[] = []
  for (const entry of raw) {
    const row = entry as MultipartPartInput
    const partNumber = Number(row.PartNumber)
    const etag = String(row.ETag ?? '').trim()
    if (!Number.isInteger(partNumber) || partNumber < 1 || !etag) {
      return null
    }
    parts.push({ ETag: etag, PartNumber: partNumber })
  }

  return parts
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
  const action = String(record.action ?? '').trim() as MultipartAction
  const albumId = String(record.album_id ?? record.albumId ?? '').trim()
  const imageId = String(record.imageId ?? record.image_id ?? '').trim()
  const originalExt = String(record.originalExt ?? record.original_ext ?? '').trim()
  const contentType =
    String(record.contentType ?? record.content_type ?? '').trim() ||
    'application/octet-stream'
  const uploadId = String(record.uploadId ?? record.upload_id ?? '').trim()
  const partNumber = Number(record.partNumber ?? record.part_number)
  const parts = parseMultipartParts(record.parts)

  if (!action) {
    return NextResponse.json(
      { ok: false, message: 'חסר action' },
      { status: 400 }
    )
  }

  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר album_id' },
      { status: 400 }
    )
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  if (action === 'init') {
    if (!imageId || !originalExt) {
      return NextResponse.json(
        { ok: false, message: 'חסרים imageId ו-originalExt' },
        { status: 400 }
      )
    }

    const ownership = await verifyImageIdsBelongToAlbum(albumId, [imageId])
    if (!ownership.ok) return adminAuthJsonResponse(ownership)

    const { key, uploadId: createdUploadId, error } =
      await createGalleryMultipartUpload(
        albumId,
        auth.photographerId,
        imageId,
        originalExt,
        contentType
      )

    if (error || !createdUploadId) {
      return NextResponse.json(
        { ok: false, message: error || 'שגיאה בייזום העלאה' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      uploadId: createdUploadId,
      key,
      expiresIn: 3600,
    })
  }

  if (!imageId || !originalExt) {
    return NextResponse.json(
      { ok: false, message: 'חסרים imageId ו-originalExt' },
      { status: 400 }
    )
  }

  const ownership = await verifyImageIdsBelongToAlbum(albumId, [imageId])
  if (!ownership.ok) return adminAuthJsonResponse(ownership)

  if (action === 'get-part-url') {
    if (!uploadId || !Number.isInteger(partNumber) || partNumber < 1) {
      return NextResponse.json(
        { ok: false, message: 'חסרים uploadId או partNumber' },
        { status: 400 }
      )
    }

    const { url, error } = await createGalleryMultipartPartUrl(
      albumId,
      auth.photographerId,
      imageId,
      originalExt,
      uploadId,
      partNumber
    )

    if (error || !url) {
      return NextResponse.json(
        { ok: false, message: error || 'שגיאה ביצירת קישור לחלק' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, url, expiresIn: 3600 })
  }

  if (action === 'complete') {
    if (!uploadId || !parts) {
      return NextResponse.json(
        { ok: false, message: 'חסרים uploadId או parts' },
        { status: 400 }
      )
    }

    const { error } = await completeGalleryMultipartUpload(
      albumId,
      auth.photographerId,
      imageId,
      originalExt,
      uploadId,
      parts
    )

    if (error) {
      return NextResponse.json({ ok: false, message: error }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  if (action === 'abort') {
    if (!uploadId) {
      return NextResponse.json(
        { ok: false, message: 'חסר uploadId' },
        { status: 400 }
      )
    }

    const { error } = await abortGalleryMultipartUpload(
      albumId,
      auth.photographerId,
      imageId,
      originalExt,
      uploadId
    )

    if (error) {
      return NextResponse.json({ ok: false, message: error }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json(
    { ok: false, message: 'action לא תקין' },
    { status: 400 }
  )
}
