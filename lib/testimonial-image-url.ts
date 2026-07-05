import { resolveBrandingPath } from '@/lib/branding-urls'
import { galleryMediaProxyUrl } from '@/lib/r2/config'
import { resolveMediaUrl } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'

const BUCKET_PREFIXES = ['previews', 'edited', 'branding'] as const

export type TestimonialImageRef = `${(typeof BUCKET_PREFIXES)[number]}:${string}`

export function parseTestimonialImageRef(
  value: string | null | undefined
): { bucket: MediaBucket; path: string } | null {
  if (!value?.trim()) return null

  const trimmed = value.trim()
  const colonIndex = trimmed.indexOf(':')
  if (colonIndex === -1) {
    return { bucket: 'branding', path: trimmed.replace(/^branding\//, '') }
  }

  const bucket = trimmed.slice(0, colonIndex) as MediaBucket
  const path = trimmed.slice(colonIndex + 1)
  if (!BUCKET_PREFIXES.includes(bucket as (typeof BUCKET_PREFIXES)[number]) || !path) {
    return null
  }

  return { bucket, path }
}

export function formatTestimonialImageRef(bucket: MediaBucket, path: string): TestimonialImageRef {
  return `${bucket}:${path}` as TestimonialImageRef
}

export async function resolveTestimonialImageUrl(value: string | null | undefined) {
  const parsed = parseTestimonialImageRef(value)
  if (!parsed) return null

  if (parsed.bucket === 'branding') {
    return resolveBrandingPath(parsed.path)
  }

  return resolveMediaUrl(parsed.bucket, parsed.path)
}

export function getTestimonialImagePreviewUrl(value: string | null | undefined): string | null {
  const parsed = parseTestimonialImageRef(value)
  if (!parsed) return null

  return galleryMediaProxyUrl(`${parsed.bucket}/${parsed.path}`)
}
