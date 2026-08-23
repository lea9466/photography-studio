import { createAdminClient } from '@/lib/supabase/admin'

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
