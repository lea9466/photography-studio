'use server'

import { getDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasActiveSubscriptionLike } from '@/lib/subscriptions/entitlements'
import {
  MARKET_SURVEY_ENDS_AT,
  MARKET_SURVEY_MAX_SHOWS,
  MARKET_SURVEY_MIN_ACCOUNT_AGE_DAYS,
  MARKET_SURVEY_MIN_HOURS_BETWEEN_SHOWS,
  marketSurveySchema,
} from '@/lib/market-survey/questions'

const HOUR_MS = 60 * 60 * 1000

/** Checks the real period end too: a lapsed one-time payment still reads `active`. */
async function hasLiveSubscription(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data, error } = await admin
    .from('subscriptions')
    .select('status, current_period_end, updated_at')
    .eq('user_id', userId)
    .in('status', ['active', 'past_due', 'payment_failed'])
  if (error) throw new Error(error.message)
  return (data ?? []).some((row) => hasActiveSubscriptionLike(row))
}

/**
 * Called by the popup when its delay ends. Counts the showing here rather than
 * on close, so leaving the page without closing it still uses one up. A second
 * tab racing this one matches no row on the `shows_count` guard and stays quiet.
 * Any failure means no popup: the survey must never get in the way.
 */
export async function claimMarketSurveyShow(): Promise<
  { show: false } | { show: true; isSubscriber: boolean }
> {
  try {
    const now = Date.now()
    if (now >= new Date(MARKET_SURVEY_ENDS_AT).getTime()) return { show: false }

    const context = await getDashboardContext()
    if (!context || context.isImpersonating) return { show: false }
    const { userId } = context
    const admin = createAdminClient()

    const { data: user, error: userError } = await admin
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .maybeSingle()
    if (userError) throw new Error(userError.message)
    if (!user) return { show: false }
    const minAgeMs = MARKET_SURVEY_MIN_ACCOUNT_AGE_DAYS * 24 * HOUR_MS
    if (now - new Date(user.created_at).getTime() < minAgeMs) return { show: false }

    const { data: row, error: rowError } = await admin
      .from('market_survey_responses')
      .select('shows_count, last_shown_at, completed_at')
      .eq('user_id', userId)
      .maybeSingle()
    if (rowError) throw new Error(rowError.message)

    const lastShownAt = new Date(now).toISOString()

    if (row) {
      if (row.completed_at || row.shows_count >= MARKET_SURVEY_MAX_SHOWS) return { show: false }
      const minGapMs = MARKET_SURVEY_MIN_HOURS_BETWEEN_SHOWS * HOUR_MS
      if (row.last_shown_at && now - new Date(row.last_shown_at).getTime() < minGapMs) {
        return { show: false }
      }
      const { data: claimed, error } = await admin
        .from('market_survey_responses')
        .update({ shows_count: row.shows_count + 1, last_shown_at: lastShownAt })
        .eq('user_id', userId)
        .eq('shows_count', row.shows_count)
        .select('user_id')
      if (error) throw new Error(error.message)
      if (!claimed?.length) return { show: false }
    } else {
      const { error } = await admin
        .from('market_survey_responses')
        .insert({ user_id: userId, shows_count: 1, last_shown_at: lastShownAt })
      // Unique violation = another tab just claimed it.
      if (error) return { show: false }
    }

    return { show: true, isSubscriber: await hasLiveSubscription(admin, userId) }
  } catch (error) {
    console.error('[claimMarketSurveyShow]', error instanceof Error ? error.message : error)
    return { show: false }
  }
}

export async function submitMarketSurvey(
  input: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const context = await getDashboardContext()
    if (!context) return { ok: false, error: 'יש להתחבר מחדש' }
    if (context.isImpersonating) return { ok: false, error: 'אי אפשר לענות בזמן התחזות' }

    const parsed = marketSurveySchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'נא לענות על כל השאלות' }
    const { canContact, ...answers } = parsed.data

    const admin = createAdminClient()
    const isSubscriber = await hasLiveSubscription(admin, context.userId)
    if (!isSubscriber && !answers.blocker) return { ok: false, error: 'נא לענות על כל השאלות' }

    const { error } = await admin
      .from('market_survey_responses')
      .update({
        completed_at: new Date().toISOString(),
        was_subscriber: isSubscriber,
        answers,
        can_contact: canContact,
      })
      .eq('user_id', context.userId)
      .is('completed_at', null)
    if (error) throw new Error(error.message)

    return { ok: true }
  } catch (error) {
    console.error('[submitMarketSurvey]', error instanceof Error ? error.message : error)
    return { ok: false, error: 'השמירה נכשלה, אפשר לנסות שוב' }
  }
}
