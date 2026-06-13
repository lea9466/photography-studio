import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
} from '@/lib/api-auth-helpers'
import { r2BucketName, r2ConfigError, r2Configured } from '@/lib/r2'
import { r2PublicConfigured } from '@/lib/r2-public'
import { createCoverPresignedPutUrl } from '@/lib/r2-storage'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

type PresignCoverBody = {
  albumId?: string
  fileName?: string
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

  let body: PresignCoverBody
  try {
    body = (await request.json()) as PresignCoverBody
  } catch {
    return NextResponse.json(
      { ok: false, message: 'גוף הבקשה אינו JSON תקין' },
      { status: 400 }
    )
  }

  const albumId = String(body.albumId ?? '').trim()
  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר albumId' },
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

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const { key, uploadUrl, url, error } = await createCoverPresignedPutUrl(
    albumId,
    auth.photographerId,
    fileName,
    contentType
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
    expiresIn: 3600,
  })
}
