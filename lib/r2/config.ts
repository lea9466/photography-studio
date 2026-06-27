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
