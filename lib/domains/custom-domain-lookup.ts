import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Resolves a connected custom domain's Host header to its owner's studio
 * slug. Uses the admin client (not the anon/RLS client `updateSession`
 * otherwise builds) — the same choice already made for
 * lib/referral/slug-redirect.ts's `resolveSlugRedirect`, which is proven
 * edge-safe in this codebase (plain @supabase/supabase-js createClient, no
 * Node-only imports), unlike the R2/SEO admin helpers the root middleware.ts
 * comment warns about.
 */
export async function resolveCustomDomainSlug(hostname: string): Promise<string | null> {
  const admin = createAdminClient()

  const { data: domain } = await admin
    .from('custom_domains')
    .select('user_id')
    .eq('hostname', hostname)
    .eq('status', 'active')
    .maybeSingle()

  const userId = (domain as { user_id: string } | null)?.user_id
  if (!userId) return null

  const { data: user } = await admin
    .from('users')
    .select('slug')
    .eq('id', userId)
    .maybeSingle()

  const slug = (user as { slug: string | null } | null)?.slug
  return slug?.trim() || null
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
