import { getAppBaseUrl } from '@/lib/seo/public-metadata'

/**
 * Private galleries are meant to live on their own dedicated subdomain,
 * isolated from the rest of the site (see middleware.ts) — this was
 * promised in writing to a content filter provider as the basis for
 * excluding that subdomain from their general image filtering. Until the
 * subdomain is actually configured in DNS/Vercel, this env var stays unset
 * and everything falls back to the main app domain exactly as before.
 */
export function getPrivateGalleryBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_PRIVATE_GALLERY_URL?.trim().replace(/\/$/, '')
  return configured || getAppBaseUrl()
}

export function getPrivateGalleryHost(): string | null {
  const configured = process.env.NEXT_PUBLIC_PRIVATE_GALLERY_URL?.trim()
  if (!configured) return null
  try {
    return new URL(configured).host
  } catch {
    return null
  }
}

export function buildPrivateGalleryUrl(galleryId: string): string {
  return `${getPrivateGalleryBaseUrl()}/g/${galleryId}`
}

export function buildPrivateGalleryPath(galleryId: string): string {
  return `/g/${galleryId}`
}
