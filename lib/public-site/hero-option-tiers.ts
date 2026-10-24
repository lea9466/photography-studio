import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_HERO_OPTION_TIERS, normalizeHeroOptionTiers, type HeroOptionTiers } from './hero-settings'

/**
 * The live free/PRO map for hero layouts + options, from the
 * `hero_option_tiers` table /manage edits. Falls back to the code defaults if
 * the table isn't migrated yet or the read fails — the gate must never take
 * the public site down.
 */
export const fetchHeroOptionTiers = cache(async (): Promise<HeroOptionTiers> => {
  const admin = createAdminClient()
  const { data, error } = await admin.from('hero_option_tiers').select('option_key, tier')
  if (error) return { ...DEFAULT_HERO_OPTION_TIERS }
  return normalizeHeroOptionTiers(data as { option_key: string; tier: string }[] | null)
})
