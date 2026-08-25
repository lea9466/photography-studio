import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Full rollout of the React public-site pipeline (see the approved
 * integration plan) — a single global DB flag, toggled from a button on
 * /manage (ReactPublicSiteToggle), controls whether every studio's public
 * pages render through the new React theme components for every real
 * visitor, or fall back to the old iframe/string-HTML system. Replaces the
 * earlier owner-only-preview + per-slug env-var allowlist
 * (isReactHomepagePreviewSlug) now that the new pipeline is going out to
 * everyone at once, with this flag as the instant kill switch if a bug
 * turns up post-launch.
 */
export const REACT_PUBLIC_SITE_CACHE_TAG = 'react-public-site-enabled'

async function fetchReactPublicSiteEnabled(): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('app_settings')
    .select('react_public_site_enabled')
    .eq('id', 1)
    .maybeSingle()
  return Boolean((data as { react_public_site_enabled?: boolean } | null)?.react_public_site_enabled)
}

// Revalidated on every toggle via revalidateTag (see
// updateReactPublicSiteEnabled in lib/actions/admin.actions.ts), so a flip
// takes effect on the next request rather than waiting out the full window —
// the 15s revalidate is just a ceiling for the rare case a request slips in
// between the DB write and the revalidateTag call.
const getCachedReactPublicSiteEnabled = unstable_cache(
  fetchReactPublicSiteEnabled,
  ['react-public-site-enabled'],
  { revalidate: 15, tags: [REACT_PUBLIC_SITE_CACHE_TAG] }
)

/**
 * Fails closed: if the settings row/table can't be read (migration not run
 * yet, transient DB error), stays on the old, already-proven system rather
 * than risk exposing every real visitor to a broken new pipeline.
 */
export async function isReactPublicSiteEnabled(): Promise<boolean> {
  try {
    return await getCachedReactPublicSiteEnabled()
  } catch {
    return false
  }
}
