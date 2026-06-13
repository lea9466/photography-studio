import 'server-only'

import { S3Client } from '@aws-sdk/client-s3'
import { buildGalleryStoragePrefix } from '@/lib/gallery-r2-paths'

let cachedClient: S3Client | null = null

export function r2BucketName(): string | undefined {
  return process.env.R2_BUCKET_NAME
}

export function r2Configured(): boolean {
  return !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT
  )
}

export function r2ConfigError(): string {
  if (!process.env.R2_ACCESS_KEY_ID) {
    return 'חסר R2_ACCESS_KEY_ID ב-.env.local'
  }
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    return 'חסר R2_SECRET_ACCESS_KEY ב-.env.local'
  }
  if (!process.env.R2_ENDPOINT) {
    return 'חסר R2_ENDPOINT ב-.env.local'
  }
  return 'Cloudflare R2 לא מוגדר'
}

/** R2 endpoint = רק host (ללא path). שם ה-bucket ב-R2_BUCKET_NAME. */
export function normalizeR2Endpoint(raw: string): string {
  const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`
  try {
    const url = new URL(withProtocol)
    return url.origin
  } catch {
    return withProtocol.replace(/\/+$/, '')
  }
}

export function formatR2Error(error: unknown): string {
  if (!(error instanceof Error)) return 'שגיאה בהעלאה ל-R2'

  const serialized = safeStringify(error)
  if (serialized.includes('netfree')) {
    return (
      'נטפרי חוסם גישה ל-Cloudflare R2 מהמחשב. ' +
      'הוסיפי לרשימה הלבנה: *.r2.cloudflarestorage.com (או בדקי העלאה מהשרת בענן).'
    )
  }

  const err = error as Error & {
    Code?: string
    name?: string
    $metadata?: { httpStatusCode?: number }
  }
  const status = err.$metadata?.httpStatusCode
  if (status === 418) {
    return (
      'הבקשה נחסמה (HTTP 418). אם יש נטפרי — הוסיפי *.r2.cloudflarestorage.com לרשימה הלבנה.'
    )
  }

  const parts: string[] = []
  if (err.name && err.name !== 'Error') parts.push(err.name)
  if (err.Code) parts.push(err.Code)
  if (err.message && err.message !== 'UnknownError') parts.push(err.message)
  else if (err.message) parts.push(err.message)
  if (status) parts.push(`HTTP ${status}`)
  return parts.length ? parts.join(' — ') : 'שגיאה בהעלאה ל-R2'
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function createR2Client(): S3Client {
  const normalizedEndpoint = normalizeR2Endpoint(process.env.R2_ENDPOINT!)

  return new S3Client({
    region: 'auto',
    endpoint: normalizedEndpoint,
    // path-style: .../albums/key — לא albums.<account>.r2... (נטפרי לעתים חוסם רק את תת-הדומיין)
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // SDK 3.729+ שולח checksums ש-R2 עדיין לא תומך — גורם ל-UnknownError / 418
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
}

/** S3Client מוגדר ל-Cloudflare R2 (שימוש בצד שרת בלבד). */
export function getR2Client(): S3Client {
  if (!r2Configured()) {
    throw new Error(r2ConfigError())
  }
  cachedClient ??= createR2Client()
  return cachedClient
}

/** מזהה גלריה בטוח לשימוש ב-prefix (ללא / או ..). */
export function sanitizeGalleryId(galleryId: string): string | null {
  const trimmed = galleryId.trim()
  if (!trimmed || !/^[\w-]+$/.test(trimmed)) return null
  return trimmed
}

/** שם קובץ בטוח ל-key ב-R2. */
export function sanitizeR2FileName(fileName: string): string {
  const base = fileName.replace(/[/\\]/g, '').replace(/[^\w.\-]+/g, '_')
  return base || 'file'
}

/** שם קובץ ייחודי — מונע דריסה בהעלאות מרובות. */
export function uniqueR2FileName(fileName: string): string {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return `${stamp}-${sanitizeR2FileName(fileName)}`
}

export {
  buildDeterministicGalleryObjectKey,
  buildGalleryStoragePrefix,
  galleryOriginalExtensionFromFileName,
  sanitizeGalleryOriginalExt,
} from '@/lib/gallery-r2-paths'

/** נתיב object ב-bucket: originals או thumbnails לפי isCompressed (שם קובץ חופשי — גיבוי). */
export function buildGalleryObjectKey(
  galleryId: string,
  fileName: string,
  isCompressed: boolean,
  photographerId: string
): string {
  const prefix = buildGalleryStoragePrefix(galleryId, photographerId)
  if (!prefix) return ''
  const folder = isCompressed ? 'thumbnails' : 'originals'
  return `${prefix}/${folder}/${fileName}`
}

/** תמונת שער לגלריה — Cloudflare R2 */
export function buildCoverObjectKey(
  galleryId: string,
  fileName: string,
  photographerId: string
): string {
  const prefix = buildGalleryStoragePrefix(galleryId, photographerId)
  if (!prefix) return ''
  return `${prefix}/covers/${fileName}`
}

export function parseIsCompressed(value: FormDataEntryValue | string | null): boolean {
  if (value === null) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
}
