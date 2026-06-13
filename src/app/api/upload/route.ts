import { NextResponse } from 'next/server'
import {
  formatR2Error,
  parseIsCompressed,
  r2BucketName,
  r2ConfigError,
  r2Configured,
  sanitizeGalleryId,
} from '@/lib/r2'
import { r2PublicUrlFromKey } from '@/lib/r2-public'
import { uploadGalleryFileToR2 } from '@/lib/r2-storage'
import { resolvePhotographerIdForAlbum } from '@/lib/photographer-scope'

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

/** בדיקת R2 ציבורית (ללא אימות אדמין) — לטופס הבדיקה בדף הבית. */
export async function POST(request: Request) {
  if (!r2Configured()) {
    return NextResponse.json(
      { ok: false, message: r2ConfigError() },
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

  const { photographerId, error: scopeError } =
    await resolvePhotographerIdForAlbum(galleryId)
  if (scopeError || !photographerId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          scopeError ??
          'galleryId חייב להיות מזהה גלריה קיים במערכת (לא מזהה צלם מהדפדפן)',
      },
      { status: 404 }
    )
  }

  try {
    const { key, url: publicUrl, error } = await uploadGalleryFileToR2(
      galleryId,
      photographerId,
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
      message: 'הקובץ הועלה בהצלחה ל-Cloudflare R2',
      key,
      url: publicUrl || r2PublicUrlFromKey(key),
      bucket,
      galleryId,
      isCompressed,
    })
  } catch (error) {
    console.error('[R2 upload]', error)
    return NextResponse.json(
      { ok: false, message: formatR2Error(error) },
      { status: 500 }
    )
  }
}
