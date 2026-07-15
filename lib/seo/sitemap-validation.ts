import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'

/** Root segments that map to static app routes — not photographer homepages. */
export const SITEMAP_RESERVED_PATH_SEGMENTS = new Set([
  'dashboard',
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'auth',
  'api',
  'g',
  'portfolio',
  'public-gallery',
  'manage',
  'accessibility',
  'privacy',
  'terms',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

export type ValidatableGallery = {
  id: string
  slug: string | null
  gallery_type: string | null
  is_public: boolean
}

export type ValidatablePhotographer = {
  id: string
  slug: string | null
  studio_name: string | null
  gallery_layout_mode: string | null
}

export function getPathSegment(studioPath: string): string {
  return decodeURIComponent(studioPath.replace(/^\//, '')).trim()
}

export function isReservedPathSegment(segment: string): boolean {
  const normalized = decodeURIComponent(segment).trim().toLowerCase()
  return SITEMAP_RESERVED_PATH_SEGMENTS.has(normalized)
}

/**
 * Returns the active public studio path, or null when the photographer cannot
 * be served at a stable, non-conflicting URL.
 */
export function resolveActiveStudioPath(photographer: {
  slug: string | null
  studio_name: string | null
}): string | null {
  const path = getPublicSitePath(photographer.slug, photographer.studio_name)
  if (!path) return null

  const segment = getPathSegment(path)
  if (!segment || isReservedPathSegment(segment)) return null

  return path
}

/**
 * Returns a gallery URL only when it matches a real app route:
 * - `/portfolio/{slug}` → portfolio gallery, public, with slug
 * - `/public-gallery/{id}` → any other public gallery
 */
export function resolveValidatedGalleryPath(gallery: ValidatableGallery): string | null {
  if (!gallery.is_public) return null

  if (gallery.gallery_type === 'portfolio') {
    const slug = gallery.slug?.trim()
    if (slug) return `/portfolio/${slug}`
  }

  return `/public-gallery/${gallery.id}`
}

export function resolveValidatedPostPath(studioPath: string | null, postId: string): string | null {
  if (!studioPath || !postId.trim()) return null
  return `${studioPath}/blog/${postId.trim()}`
}

export function resolveValidatedBlogPath(studioPath: string | null): string | null {
  if (!studioPath) return null
  return `${studioPath}/blog`
}

export function resolveValidatedPortfolioPath(
  photographer: ValidatablePhotographer,
  studioPath: string | null
): string | null {
  if (!studioPath) return null
  if ((photographer.gallery_layout_mode ?? 'separated') !== 'portfolio') return null
  return `${studioPath}/portfolio`
}

export function isPhotographerPathResolvable(
  photographer: ValidatablePhotographer,
  resolvedPath: string
): boolean {
  const activePath = resolveActiveStudioPath(photographer)
  return activePath === resolvedPath
}

/**
 * Confirms the studio path resolves to this photographer via the same lookup
 * used by public pages (`findPhotographerBySlug`).
 */
export async function validateStudioPathLive(
  photographer: ValidatablePhotographer
): Promise<string | null> {
  const path = resolveActiveStudioPath(photographer)
  if (!path) return null

  const found = await findPhotographerBySlug(getPathSegment(path))
  if (!found || found.id !== photographer.id) return null

  return path
}
