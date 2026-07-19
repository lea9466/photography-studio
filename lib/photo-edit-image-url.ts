import { resolveBrandingPath } from '@/lib/branding-urls'
import { galleryMediaProxyUrl, r2PublicObjectUrl } from '@/lib/r2/config'
import { resolveMediaUrl } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'

const ALLOWED_BUCKETS = ['previews', 'watermarked', 'branding'] as const

export type PhotoEditImageRef = {
  bucket: MediaBucket
  path: string
}

/**
 * Accepts:
 * - bare R2 path (gallery/post style) → treated as `previews`
 * - `previews:path` / `watermarked:path`
 * - legacy `branding:path` from the first photo-edits implementation
 */
export function parsePhotoEditImageRef(
  value: string | null | undefined,
  fallbackBucket: MediaBucket = 'previews'
): PhotoEditImageRef | null {
  if (!value?.trim()) return null

  const trimmed = value.trim()
  const colonIndex = trimmed.indexOf(':')
  if (colonIndex === -1) {
    return { bucket: fallbackBucket, path: trimmed }
  }

  const bucket = trimmed.slice(0, colonIndex) as MediaBucket
  const path = trimmed.slice(colonIndex + 1)
  if (!ALLOWED_BUCKETS.includes(bucket as (typeof ALLOWED_BUCKETS)[number]) || !path) {
    return null
  }

  return { bucket, path }
}

export function assertOwnedPhotoEditPath(userId: string, path: string) {
  return path.startsWith(`${userId}/photo-edits/`)
}

export async function resolvePhotoEditImageUrl(
  value: string | null | undefined,
  fallbackBucket: MediaBucket = 'previews'
) {
  const parsed = parsePhotoEditImageRef(value, fallbackBucket)
  if (!parsed) return null

  if (parsed.bucket === 'branding') {
    return resolveBrandingPath(parsed.path)
  }

  return resolveMediaUrl(parsed.bucket, parsed.path)
}

/**
 * Dashboard/client preview URL.
 * Prefer public CDN (same as posts). Fall back to gallery-media proxy.
 */
export function getPhotoEditImagePreviewUrl(
  value: string | null | undefined,
  fallbackBucket: MediaBucket = 'previews'
): string | null {
  const parsed = parsePhotoEditImageRef(value, fallbackBucket)
  if (!parsed) return null

  const key = `${parsed.bucket}/${parsed.path}`
  return r2PublicObjectUrl(key) ?? galleryMediaProxyUrl(key)
}

/** Pick preview vs watermarked path for public/dashboard display. */
export function pickPhotoEditDisplayPath(options: {
  previewPath: string
  watermarkedPath: string | null | undefined
  autoApplyWatermark: boolean
}) {
  if (options.autoApplyWatermark && options.watermarkedPath) {
    return {
      path: options.watermarkedPath,
      bucket: 'watermarked' as const,
    }
  }
  return {
    path: options.previewPath,
    bucket: 'previews' as const,
  }
}

export async function resolvePhotoEditDisplayUrl(options: {
  previewPath: string
  watermarkedPath: string | null | undefined
  autoApplyWatermark: boolean
}) {
  const picked = pickPhotoEditDisplayPath(options)
  return resolvePhotoEditImageUrl(picked.path, picked.bucket)
}

export function getPhotoEditDisplayPreviewUrl(options: {
  previewPath: string
  watermarkedPath: string | null | undefined
  autoApplyWatermark: boolean
  /** Optional map from storage path → already-signed/public URL */
  signedUrls?: Record<string, string>
}) {
  const picked = pickPhotoEditDisplayPath(options)
  if (options.signedUrls?.[picked.path]) {
    return options.signedUrls[picked.path]
  }
  return getPhotoEditImagePreviewUrl(picked.path, picked.bucket)
}
