import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_HERO_OPTION_TIERS, normalizeHeroOptionTiers, type HeroOptionTiers } from './hero-settings'

export const HERO_OPTION_TIERS_CACHE_TAG = 'hero-option-tiers'

async function readHeroOptionTiers(): Promise<HeroOptionTiers> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('hero_option_tiers').select('option_key, tier')
  // Thrown (not defaulted) so a failed read is never stored in the cache.
  if (error) throw new Error(error.message)
  return normalizeHeroOptionTiers(data as { option_key: string; tier: string }[] | null)
}

// Global table read on every public page view — cached across requests
// instead of re-queried each time (it was one of the top Supabase log
// sources). /manage's PUT (app/api/admin/hero-option-tiers/route.ts)
// revalidates the tag, so a flip shows up on the next request; the 5-minute
// window is only a ceiling for anything that slips past that.
const getCachedHeroOptionTiers = unstable_cache(readHeroOptionTiers, ['hero-option-tiers'], {
  revalidate: 300,
  tags: [HERO_OPTION_TIERS_CACHE_TAG],
})

/**
 * The live free/PRO map for hero layouts + options, from the
 * `hero_option_tiers` table /manage edits. Falls back to the code defaults if
 * the table isn't migrated yet or the read fails — the gate must never take
 * the public site down.
 */
export const fetchHeroOptionTiers = cache(async (): Promise<HeroOptionTiers> => {
  try {
    return await getCachedHeroOptionTiers()
  } catch {
    return { ...DEFAULT_HERO_OPTION_TIERS }
  }
})
