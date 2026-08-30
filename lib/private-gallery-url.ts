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

/**
 * Re-exported from the Edge-safe, unit-tested source of truth. Kept here too
 * because this module is the natural import site for private-gallery URL
 * helpers — but there is only one implementation (with the "don't point this
 * at the app's own host" guard), in lib/private-gallery/isolation.ts.
 */
export { getPrivateGalleryHost } from '@/lib/private-gallery/isolation'

export function buildPrivateGalleryUrl(galleryId: string): string {
  return `${getPrivateGalleryBaseUrl()}/g/${galleryId}`
}

export function buildPrivateGalleryPath(galleryId: string): string {
  return `/g/${galleryId}`
}
