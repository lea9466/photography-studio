import { extractBrandingStoragePath } from '@/lib/branding-preview-url'
import { getBrandingFaviconStoragePath } from '@/lib/branding/logo-favicon-path'
import { buildCanonicalUrl } from '@/lib/seo/public-metadata'
export function getBrandingPublicMediaPath(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl?.trim()) return null

  const storagePath = extractBrandingStoragePath(pathOrUrl.trim())
  if (!storagePath || storagePath.includes('..')) return null

  const segments = storagePath
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')

  if (!segments) return null

  return `/media/branding/${segments}`
}

export function getBrandingPublicMediaUrl(pathOrUrl: string | null | undefined): string | null {
  const path = getBrandingPublicMediaPath(pathOrUrl)
  if (!path) return null
  return buildCanonicalUrl(path)
}

export function getBrandingFaviconPublicUrl(
  userId: string,
  logoPath: string | null | undefined
): string | null {
  const storagePath = getBrandingFaviconStoragePath(userId, logoPath)
  if (!storagePath) return null
  return getBrandingPublicMediaUrl(storagePath)
}
