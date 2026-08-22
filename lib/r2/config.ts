function firstNonEmptyEnv(...keys: string[]) {
  for (const key of keys) {
    const trimmed = process.env[key]?.trim()
    if (trimmed) return trimmed.replace(/\/+$/, '')
  }
  return ''
}

/** R2 endpoint = host only (no /albums path). Bucket name lives in R2_BUCKET_NAME. */
export function normalizeR2Endpoint(raw: string) {
  const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`
  try {
    return new URL(withProtocol).origin
  } catch {
    return withProtocol.replace(/\/+$/, '')
  }
}

export function r2PublicBaseUrl() {
  return firstNonEmptyEnv(
    'NEXT_PUBLIC_R2_PUBLIC_URL',
    'R2_PUBLIC_URL',
    'NEXT_PUBLIC_R2_BASE_URL'
  )
}

/** Direct public CDN URL for an R2 object key, or null if public URL is unset. */
export function r2PublicObjectUrl(key: string): string | null {
  const publicUrl = r2PublicBaseUrl()
  if (!publicUrl) return null
  const normalizedKey = key.replace(/^\/+/, '').trim()
  if (!normalizedKey) return null
  return `${publicUrl}/${normalizedKey}`
}

/**
 * Base URL for private-gallery media (viewing + downloads) —
 * https://private.studio-galleries.com/media, served by the same
 * gallery-media-guard Worker as the public CDN domain, via a second route.
 * Deliberately reads NEXT_PUBLIC_PRIVATE_GALLERY_URL directly here instead
 * of importing lib/private-gallery-url.ts, which pulls in lib/seo/public-
 * metadata.ts — that module imports back from lib/r2/storage.ts, and this
 * file is imported by storage.ts, so going through it would create a
 * circular import.
 */
export function privateMediaBaseUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_PRIVATE_GALLERY_URL?.trim().replace(/\/+$/, '')
  return configured ? `${configured}/media` : null
}

export function galleryMediaProxyUrl(key: string, galleryId?: string) {
  const normalizedKey = key.replace(/^\/+/, '')
  const url = `/api/gallery-media?key=${encodeURIComponent(normalizedKey)}`
  if (galleryId) {
    return `${url}&galleryId=${encodeURIComponent(galleryId)}`
  }
  return url
}

export function getR2Config() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const endpoint = process.env.R2_ENDPOINT
  const bucketName = process.env.R2_BUCKET_NAME
  const publicUrl = r2PublicBaseUrl()

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    throw new Error(
      'חסרות הגדרות R2 — הוסיפו R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME ל-.env.local'
    )
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint: normalizeR2Endpoint(endpoint),
    bucketName,
    publicUrl: publicUrl || null,
  }
}

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_ENDPOINT &&
      process.env.R2_BUCKET_NAME
  )
}
