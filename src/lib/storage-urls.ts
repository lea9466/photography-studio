import { isR2PublicUrl } from '@/lib/r2-public'

export const SITE_STORAGE_BUCKET = 'albums'

const PUBLIC_MARKER = `/storage/v1/object/public/${SITE_STORAGE_BUCKET}/`

export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  return !!url?.includes(PUBLIC_MARKER)
}

export function supabaseStoragePathFromUrl(url: string): string | null {
  const trimmed = url.trim()
  const index = trimmed.indexOf(PUBLIC_MARKER)
  if (index < 0) return null
  try {
    return decodeURIComponent(trimmed.slice(index + PUBLIC_MARKER.length))
  } catch {
    return trimmed.slice(index + PUBLIC_MARKER.length)
  }
}

export function supabasePublicUrlFromPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '') ?? ''
  const normalized = path.replace(/^\/+/, '')
  return `${base}/storage/v1/object/public/${SITE_STORAGE_BUCKET}/${normalized}`
}

export function isLegacyCloudinaryUrl(url: string | null | undefined): boolean {
  return !!url?.includes('res.cloudinary.com')
}

export function isAlbumOwnedCoverUrl(
  coverImage: string | null | undefined,
  albumId: string,
  photographerId?: string | null
): boolean {
  const url = coverImage?.trim()
  if (!url) return false
  if (
    photographerId &&
    url.includes(`photographers/${photographerId}/galleries/${albumId}/covers/`)
  ) {
    return true
  }
  if (url.includes(`galleries/${albumId}/covers/`)) return true
  if (isLegacyCloudinaryUrl(url) && url.includes(`gallery/${albumId}/`)) {
    return true
  }
  return false
}

export function isManagedMediaUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim()
  if (!trimmed) return false
  return (
    isR2PublicUrl(trimmed) ||
    isSupabaseStorageUrl(trimmed) ||
    isLegacyCloudinaryUrl(trimmed)
  )
}

export function fileNameFromMediaUrl(url: string, index: number): string {
  const trimmed = url.trim()
  try {
    const pathname = new URL(trimmed).pathname
    const base = pathname.split('/').pop()?.trim()
    if (base) return decodeURIComponent(base)
  } catch {
    const base = trimmed.split('/').pop()?.trim()
    if (base) return base
  }
  return `image-${String(index + 1).padStart(3, '0')}.jpg`
}
