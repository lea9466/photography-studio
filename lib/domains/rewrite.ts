/**
 * Set by the middleware's tenant-host rewrite on every request it forwards
 * (see lib/supabase/middleware.ts), so a page rendered under that rewrite
 * can tell it's being viewed on a photographer's own domain rather than the
 * main app's `/{slug}` path — needed anywhere a page would otherwise
 * `redirect()` to a slug-prefixed path (e.g. `/{slug}#gallery`), which
 * would 404 on a custom domain since only a small, fixed set of paths are
 * recognized there. See app/[slug]/portfolio/page.tsx for the one place
 * this currently matters.
 */
export const TENANT_HOST_HEADER = 'x-tenant-custom-domain'

/**
 * Maps a request path on a photographer's connected custom domain to the
 * equivalent path under their studio slug (e.g. `/blog/hello` + slug `john`
 * -> `/john/blog/hello`). Kept as a pure function so it's unit-testable
 * without spinning up the Edge middleware runtime — see
 * lib/supabase/middleware.ts for where it's actually applied.
 *
 * Returns null for anything not on this allowlist: an unrecognized path
 * under a tenant's own domain must 404, not silently fall back to serving
 * the slug's homepage or exposing an unrelated app route.
 */
export function resolveCustomDomainRewrite(pathname: string, slug: string): string | null {
  if (pathname === '/') return `/${slug}`
  if (pathname === '/portfolio') return `/${slug}/portfolio`
  if (pathname === '/blog') return `/${slug}/blog`
  if (pathname === '/before-after') return `/${slug}/before-after`
  if (pathname === '/seo-map') return `/${slug}/seo-map`

  const blogPostMatch = pathname.match(/^\/blog\/([^/]+)$/)
  if (blogPostMatch) return `/${slug}/blog/${blogPostMatch[1]}`

  return null
}

/**
 * Next internals and API routes — left completely alone on a tenant custom
 * domain (no rewrite, no redirect). API routes take ids/params rather than
 * depending on the Host header for tenant resolution, and client-side code
 * on a rewritten public page calls them with relative URLs; redirecting them
 * to the main app host would turn same-origin fetches into cross-origin ones
 * and break them on CORS grounds.
 */
export function isPassthroughCustomDomainPath(pathname: string): boolean {
  return pathname === '/favicon.ico' || pathname.startsWith('/_next') || pathname.startsWith('/api')
}

/**
 * Browser-navigable routes that must never render under a photographer's
 * own domain — sent back to the main app host instead. (Not a security
 * boundary by itself — auth cookies are host-scoped so a session on the main
 * domain was never visible here anyway — but rendering the platform's own
 * login/dashboard/admin chrome under someone's personal domain is confusing
 * and off-brand, so it's redirected rather than left to render.)
 */
export function isBrowserOnlyReservedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/manage')
  )
}
