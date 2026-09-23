import 'server-only'

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type MarketingStat = {
  key: 'studios' | 'galleries' | 'photos'
  label: string
  /** Rounded DOWN for display, so the page never overstates the real count. */
  value: number
  /** True when `value` is a floor of the real count and should render as "N+". */
  plus: boolean
}

// Below this a number reads as weak social proof rather than strong, so the
// stat is simply left out (never padded or faked).
const MIN_DISPLAY_COUNT = 10

function toDisplay(count: number): { value: number; plus: boolean } {
  if (count >= 1000) return { value: Math.floor(count / 100) * 100, plus: true }
  if (count >= 100) return { value: Math.floor(count / 10) * 10, plus: true }
  return { value: count, plus: false }
}

async function fetchMarketingStats(): Promise<MarketingStat[]> {
  const admin = createAdminClient()

  // One page, one narrative (unlike the earlier two-zone homepage this
  // replaced) — so showcase and client galleries are counted together as a
  // single "galleries" total instead of being split by product.
  const [studios, galleries, photos] = await Promise.all([
    admin.from('users').select('id', { count: 'exact', head: true }),
    admin.from('galleries').select('id', { count: 'exact', head: true }),
    admin.from('photos').select('id', { count: 'exact', head: true }),
  ])

  if (studios.error || galleries.error || photos.error) {
    throw new Error('marketing stats query failed')
  }

  const candidates: { key: MarketingStat['key']; label: string; count: number | null }[] = [
    { key: 'studios', label: 'צלמות וסטודיואים בפלטפורמה', count: studios.count },
    { key: 'galleries', label: 'גלריות דיגיטליות שנוצרו', count: galleries.count },
    { key: 'photos', label: 'תמונות מנוהלות במערכת', count: photos.count },
  ]

  return candidates.flatMap(({ key, label, count }) =>
    count != null && count >= MIN_DISPLAY_COUNT ? [{ key, label, ...toDisplay(count) }] : []
  )
}

// Counts change slowly and every visit would otherwise hit the DB three
// times, so one shared result is reused for an hour.
const getCachedMarketingStats = unstable_cache(fetchMarketingStats, ['marketing-stats-v4'], {
  revalidate: 3600,
})

/** Fails closed to an empty list: if the counts can't be read, the counters
 *  are hidden rather than showing a made-up or stale-looking number. */
export async function getMarketingStats(): Promise<MarketingStat[]> {
  try {
    return await getCachedMarketingStats()
  } catch {
    return []
  }
}
