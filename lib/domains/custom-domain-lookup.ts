import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { withTimeout } from '@/lib/utils/with-timeout'

const METADATA_LOOKUP_TIMEOUT_MS = 4000

/**
 * Hard ceiling on the DB round-trip inside middleware. There is otherwise no
 * timeout anywhere in this chain — the shared fetchWithRetry
 * (lib/supabase/fetch.ts) only retries on connection-level errors, never
 * bounds a call that simply hangs — and a request that runs long enough
 * takes down the ENTIRE middleware invocation with Vercel's
 * MIDDLEWARE_INVOCATION_TIMEOUT, not just this lookup. Comfortably under
 * Vercel's own Edge Middleware execution limit, generous for a single
 * indexed query that should normally return in well under a second.
 */
const LOOKUP_TIMEOUT_MS = 4000

/**
 * Resolves a connected custom domain's Host header to its owner's studio
 * slug. Uses the admin client (not the anon/RLS client `updateSession`
 * otherwise builds) — the same choice already made for
 * lib/referral/slug-redirect.ts's `resolveSlugRedirect`, which is proven
 * edge-safe in this codebase (plain @supabase/supabase-js createClient, no
 * Node-only imports), unlike the R2/SEO admin helpers the root middleware.ts
 * comment warns about.
 *
 * A single embedded-join query (not two sequential round-trips) — halves
 * the latency this adds to every tenant-domain request. Fails CLOSED: a
 * timeout or any query error resolves to null, which the caller (middleware)
 * turns into a 404 rather than hanging — the custom-domain path degrading
 * briefly during a DB hiccup is an acceptable tradeoff for never risking a
 * timed-out middleware invocation again. Only ever reached for a host that
 * already failed isKnownAppHost, so the main app domain is never affected by
 * this call, slow or not.
 */
export async function resolveCustomDomainSlug(hostname: string): Promise<string | null> {
  const admin = createAdminClient()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)

  try {
    const { data } = await admin
      .from('custom_domains')
      .select('users!inner(slug)')
      .eq('hostname', hostname)
      .eq('status', 'active')
      .abortSignal(controller.signal)
      .maybeSingle()

    const slug = (data as { users: { slug: string | null } | null } | null)?.users?.slug
    return slug?.trim() || null
  } catch (error) {
    console.error('[custom-domain-lookup] failed, treating as not found', {
      hostname,
      error: error instanceof Error ? error.message : error,
    })
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Defense in depth beyond the Zod validation already applied before a
 * hostname is stored (lib/validations/domain.ts) — protects against any
 * future write path (an admin tool, a manual DB fix) that skips it. Exported
 * standalone so it's unit-testable without a DB.
 */
export function sanitizeCustomDomainHostname(hostname: string): string | null {
  return hostname.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '') || null
}

/**
 * Resolves a photographer's own active custom domain (if any) — used for SEO
 * canonical/OG/JSON-LD URLs, independent of which host the current visitor is
 * on (unlike resolveCustomDomainSlug above, which is about the CURRENT
 * request's Host header). Wrapped in React's cache() since generateMetadata
 * and the page component both need this value independently within the same
 * request (same pattern as findPhotographerBySlug).
 *
 * Runs in a normal Node/Server Component context (not Edge middleware), so
 * withTimeout (a race, not a true abort) is the right level of caution here —
 * no need for the AbortController ceremony resolveCustomDomainSlug uses for
 * the Edge Middleware's much tighter execution ceiling. Fails safe to null on
 * any error or timeout, which callers treat as "no custom domain" — a stale
 * canonical during a DB hiccup is far better than a broken page.
 */
export const getActiveCustomDomainHost = cache(async (userId: string): Promise<string | null> => {
  try {
    const admin = createAdminClient()
    const query = admin
      .from('custom_domains')
      .select('hostname')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    const { data } = await withTimeout(query, METADATA_LOOKUP_TIMEOUT_MS, { data: null, error: null } as Awaited<
      typeof query
    >)

    const hostname = (data as { hostname: string } | null)?.hostname
    if (!hostname) return null

    return sanitizeCustomDomainHostname(hostname)
  } catch (error) {
    console.error('[custom-domain-lookup] getActiveCustomDomainHost failed, treating as none', {
      userId,
      error: error instanceof Error ? error.message : error,
    })
    return null
  }
})

/**
 * The admin-entered Search Console "HTML tag" verification token for a
 * photographer's connected domain (see /manage's CustomDomainVerification
 * section) — rendered as Next's built-in `verification.google` metadata
 * field on every page under that domain. Full API-driven verification
 * (Site Verification API via a service account/OAuth) was attempted and
 * abandoned: this Google Cloud org disables service account key creation by
 * default, and the OAuth fallback hit an access_denied wall that would need
 * Workspace super-admin access not available here — so this is entered
 * manually, once per domain, instead. Same cache()/timeout/fail-safe shape
 * as getActiveCustomDomainHost, for the same reasons.
 */
export const getGoogleSiteVerificationToken = cache(async (userId: string): Promise<string | null> => {
  try {
    const admin = createAdminClient()
    const query = admin
      .from('custom_domains')
      .select('google_site_verification_token')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    const { data } = await withTimeout(query, METADATA_LOOKUP_TIMEOUT_MS, { data: null, error: null } as Awaited<
      typeof query
    >)

    return (data as { google_site_verification_token: string | null } | null)?.google_site_verification_token ?? null
  } catch (error) {
    console.error('[custom-domain-lookup] getGoogleSiteVerificationToken failed, treating as none', {
      userId,
      error: error instanceof Error ? error.message : error,
    })
    return null
  }
})

/**
 * Convenience wrapper around getActiveCustomDomainHost for the common
 * call site — every generateMetadata() that wants its canonical/OG/JSON-LD
 * URLs to prefer the photographer's connected domain needs exactly this:
 * `https://{host}` or undefined (buildCanonicalUrl's default already falls
 * back to the app's own domain when baseUrl is undefined).
 */
export async function getCanonicalBaseUrl(userId: string): Promise<string | undefined> {
  const host = await getActiveCustomDomainHost(userId)
  return host ? `https://${host}` : undefined
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

/**
 * Hosts that must never be treated as a tenant custom domain: the app's own
 * host, the isolated private-gallery host (see root middleware.ts), Vercel
 * preview deployments, and localhost.
 */
export function isKnownAppHost(host: string): boolean {
  const appHost = process.env.NEXT_PUBLIC_APP_URL ? safeHost(process.env.NEXT_PUBLIC_APP_URL) : null
  const privateGalleryHost = process.env.NEXT_PUBLIC_PRIVATE_GALLERY_URL
    ? safeHost(process.env.NEXT_PUBLIC_PRIVATE_GALLERY_URL)
    : null

  return (
    host === appHost ||
    host === privateGalleryHost ||
    host === 'localhost' ||
    host.endsWith('.vercel.app')
  )
}
