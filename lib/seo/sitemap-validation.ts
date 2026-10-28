import { getPublicSitePath } from '@/lib/queries/public-photographer'

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
 * - `/portfolio/{slug}` → portfolio gallery, public, with slug (a separate,
 *   still fully old-system route — unrelated to studioPath, unaffected by
 *   the /[slug]/gallery/[id] migration)
 * - `{studioPath}/gallery/{id}` → any other public gallery, when the caller
 *   has a studioPath to give
 * - `/public-gallery/{id}` → same case, when studioPath isn't available —
 *   still correct, since that's now a redirect shim straight to the path
 *   above (see app/public-gallery/[id]/page.tsx's doc comment)
 */
export function resolveValidatedGalleryPath(
  gallery: ValidatableGallery,
  studioPath?: string
): string | null {
  if (!gallery.is_public) return null

  if (gallery.gallery_type === 'portfolio') {
    const slug = gallery.slug?.trim()
    if (slug) return `/portfolio/${slug}`
  }

  // studioPath !== undefined (not just truthy) so an explicit '' — a
  // connected custom domain's root-relative base, see app/sitemap.ts — still
  // takes the {studioPath}/gallery/{id} branch instead of falling through to
  // the legacy /public-gallery/{id} shim, which isn't a recognized tenant
  // path (see lib/domains/rewrite.ts) and would 404 there.
  return studioPath !== undefined ? `${studioPath}/gallery/${gallery.id}` : `/public-gallery/${gallery.id}`
}

// All three checks below are `=== null` (not a falsy check) so that an
// explicit '' — a connected custom domain's root-relative base, see
// app/sitemap.ts — still builds a root-relative path instead of being
// treated the same as "no path at all" the way `!studioPath` would.
export function resolveValidatedPostPath(studioPath: string | null, postId: string): string | null {
  if (studioPath === null || !postId.trim()) return null
  return `${studioPath}/blog/${postId.trim()}`
}

export function resolveValidatedBlogPath(studioPath: string | null): string | null {
  if (studioPath === null) return null
  return `${studioPath}/blog`
}

export function resolveValidatedPortfolioPath(
  photographer: ValidatablePhotographer,
  studioPath: string | null
): string | null {
  if (studioPath === null) return null
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
 * Builds a validator that confirms a studio path resolves to this
 * photographer, by the same rule public pages use (`findPhotographerBySlug`:
 * exact slug match first, else the first studio_name match) — but in memory,
 * against the full studio list the sitemap already loaded. It used to run
 * findPhotographerBySlug once per studio on every sitemap request, ~180 DB
 * queries per crawl and the single biggest Supabase log source.
 */
export function createStudioPathValidator(roster: ValidatablePhotographer[]) {
  const bySlug = new Map<string, string>()
  const byStudioName = new Map<string, string>()
  for (const row of roster) {
    if (row.slug && !bySlug.has(row.slug)) bySlug.set(row.slug, row.id)
    if (row.studio_name && !byStudioName.has(row.studio_name)) byStudioName.set(row.studio_name, row.id)
  }

  return (photographer: ValidatablePhotographer): string | null => {
    const path = resolveActiveStudioPath(photographer)
    if (!path) return null

    const segment = getPathSegment(path)
    const ownerId = bySlug.get(segment) ?? byStudioName.get(segment)
    return ownerId === photographer.id ? path : null
  }
}
