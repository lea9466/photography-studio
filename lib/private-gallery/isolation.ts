/**
 * Pure routing decision for the isolated private-gallery subdomain.
 *
 * Private galleries are promised (in writing, to a content-filter provider)
 * to live in isolation on their own subdomain — nothing else may be served
 * from it, and old links on the main domain must hand off to it rather than
 * serving the gallery directly.
 *
 * Extracted out of middleware.ts so this can be unit-tested without spinning
 * up the Edge runtime (see scripts/test-private-gallery-isolation.ts).
 * Deliberately dependency-free: it's imported into Edge middleware, and
 * anything pulling in the R2/Supabase admin SDKs (as lib/seo/public-metadata
 * and friends do) would break the middleware bundle.
 */

/**
 * Paths the private-gallery host is allowed to serve. Anything not matched
 * here gets a 404 on that host.
 *
 * - `/g/`      — the private gallery pages themselves (Server Actions for the
 *                password gate / selections / downloads also POST back to
 *                this same path, so they're covered).
 * - `/_next/`  — the app's JS chunks, RSC payloads, image optimizer.
 */
export const PRIVATE_GALLERY_ALLOWED_PREFIXES = ['/g/', '/_next/'] as const

/**
 * Exact paths (no sub-paths) also allowed. `/api/gallery-media` is the local
 * dev / no-CDN fallback media proxy; matched exactly rather than by prefix so
 * an unrelated future `/api/gallery-media-*` route can't ride the allowlist.
 */
export const PRIVATE_GALLERY_ALLOWED_EXACT = ['/favicon.ico', '/api/gallery-media'] as const

export function isAllowedOnPrivateGalleryHost(pathname: string): boolean {
  if ((PRIVATE_GALLERY_ALLOWED_EXACT as readonly string[]).includes(pathname)) {
    return true
  }
  return PRIVATE_GALLERY_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Resolves `NEXT_PUBLIC_PRIVATE_GALLERY_URL` to its host, or null when the
 * isolation should not be active: the var is unset, malformed, or — a
 * misconfiguration guard — identical to the main app's own host. Pointing
 * this env var at the app's own domain would make the isolation block 404
 * almost the entire site, so refuse to activate rather than risk that.
 *
 * This is the single source of truth for "what host, if any, is the private
 * gallery host" — lib/private-gallery-url.ts and lib/r2/config.ts read the
 * raw env var directly only because they can't import this Edge-safe module
 * without dragging in their own heavier dependency graphs.
 */
export function getPrivateGalleryHost(): string | null {
  const configured = process.env.NEXT_PUBLIC_PRIVATE_GALLERY_URL?.trim()
  if (!configured) return null
  try {
    const host = new URL(configured).host
    const appHost = process.env.NEXT_PUBLIC_APP_URL?.trim()
      ? new URL(process.env.NEXT_PUBLIC_APP_URL.trim()).host
      : null
    if (appHost && host === appHost) return null
    return host
  } catch {
    return null
  }
}

export type PrivateGalleryRouting =
  | { action: 'passthrough' }
  | { action: 'block' }
  | { action: 'redirect'; host: string }

/**
 * Given the current request's Host header + path and the configured private
 * gallery host, decides what the middleware should do:
 *
 * - `block`       → return 404 (a non-allowlisted path reached the private host)
 * - `redirect`    → 308 to the private host (a `/g/` link opened on the main domain)
 * - `passthrough` → hand off to the normal middleware chain unchanged
 *
 * When no private gallery host is configured, always `passthrough` — the
 * feature is dormant and the main domain serves `/g/` itself, exactly as
 * before the subdomain existed.
 */
export function decidePrivateGalleryRouting(
  requestHost: string | null,
  pathname: string,
  privateGalleryHost: string | null
): PrivateGalleryRouting {
  if (!privateGalleryHost) return { action: 'passthrough' }

  if (requestHost === privateGalleryHost) {
    return isAllowedOnPrivateGalleryHost(pathname)
      ? { action: 'passthrough' }
      : { action: 'block' }
  }

  if (pathname.startsWith('/g/')) {
    return { action: 'redirect', host: privateGalleryHost }
  }

  return { action: 'passthrough' }
}
