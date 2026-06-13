import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
} from '@/lib/api-auth-helpers'
import {
  formatR2Error,
  parseIsCompressed,
  r2BucketName,
  r2ConfigError,
  r2Configured,
  sanitizeGalleryId,
} from '@/lib/r2'
import { r2PublicConfigured } from '@/lib/r2-public'
import { uploadGalleryFileToR2 } from '@/lib/r2-storage'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

function readGalleryId(formData: FormData, url: URL): string {
  const fromForm = String(formData.get('galleryId') ?? '').trim()
  if (fromForm) return fromForm
  return String(url.searchParams.get('galleryId') ?? '').trim()
}

function readIsCompressed(formData: FormData, url: URL): boolean {
  if (formData.has('isCompressed')) {
    return parseIsCompressed(formData.get('isCompressed'))
  }
  if (url.searchParams.has('isCompressed')) {
    return parseIsCompressed(url.searchParams.get('isCompressed'))
  }
  return false
}

/** גיבוי/כלי בדיקה — העלאת גלריה באדמין משתמשת ב-/api/admin/r2-presign + PUT ישיר ל-R2. */
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

  const url = new URL(request.url)
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { ok: false, message: 'לא נבחר קובץ להעלאה (שדה: file)' },
      { status: 400 }
    )
  }

  const galleryId = sanitizeGalleryId(readGalleryId(formData, url))
  if (!galleryId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'חסר או לא תקין galleryId (FormData או query param — אותיות, מספרים, _ ו-)',
      },
      { status: 400 }
    )
  }

  const isCompressed = readIsCompressed(formData, url)
  const body = Buffer.from(await file.arrayBuffer())

  const auth = await requirePhotographerAlbumAccess(galleryId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  try {
    const { key, url: publicUrl, error } = await uploadGalleryFileToR2(
      galleryId,
      auth.photographerId,
      file.name,
      body,
      file.type || 'application/octet-stream',
      isCompressed
    )
    if (error) {
      return NextResponse.json({ ok: false, message: error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: isCompressed
        ? 'מיניאטורה הועלתה ל-R2'
        : 'תמונת מקור הועלתה ל-R2',
      key,
      url: publicUrl,
      bucket,
      galleryId,
      isCompressed,
    })
  } catch (error) {
    console.error('[R2 admin upload]', error)
    return NextResponse.json(
      { ok: false, message: formatR2Error(error) },
      { status: 500 }
    )
  }
}
