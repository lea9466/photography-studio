'use server'

import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { fetchHeroOptionTiers } from '@/lib/public-site/hero-option-tiers'
import { heroOptionLabel, normalizeHeroSettings, proHeroOptionsInUse } from '@/lib/public-site/hero-settings'

export type SaveHeroSettingsResult =
  | { ok: true }
  | { ok: false; error: string; proOptions?: string[] }

/**
 * Saves the hero editor's settings; `null` = back to the theme's own hero
 * (always allowed). A free studio can't save anything PRO — re-checked here
 * against the live tiers, whatever the editor showed.
 */
export async function saveHeroSettings(raw: unknown): Promise<SaveHeroSettingsResult> {
  const settings = raw === null ? null : normalizeHeroSettings(raw)
  if (raw !== null && !settings) {
    return { ok: false, error: 'הפריסה שנבחרה לא תקינה, נסי לרענן את הדף' }
  }

  const { userId, supabase } = await requireDashboardContext()

  if (settings) {
    const [entitlements, tiers] = await Promise.all([getStudioEntitlements(userId), fetchHeroOptionTiers()])
    const blocked = entitlements.isPro ? [] : proHeroOptionsInUse(settings, tiers)
    if (blocked.length > 0) {
      return {
        ok: false,
        error: 'חלק מהאפשרויות שבחרת זמינות רק במנוי פרו',
        proOptions: blocked.map(heroOptionLabel),
      }
    }
  }

  const { error } = await supabase
    .from('users')
    .update({ hero_settings: settings } as never)
    .eq('id', userId)

  if (error) {
    return { ok: false, error: 'השמירה נכשלה, נסי שוב' }
  }

  revalidatePath('/dashboard/site-hero')
  return { ok: true }
}
