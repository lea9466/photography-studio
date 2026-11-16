'use server'

import { getDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  LEARNING_SURVEY_ENDS_AT,
  LEARNING_SURVEY_MAX_SHOWS,
  LEARNING_SURVEY_MIN_ACCOUNT_AGE_DAYS,
  LEARNING_SURVEY_MIN_HOURS_BETWEEN_SHOWS,
  learningSurveySchema,
} from '@/lib/learning-survey/questions'
import {
  MARKET_SURVEY_ENDS_AT,
  MARKET_SURVEY_MAX_SHOWS,
  MARKET_SURVEY_MIN_HOURS_BETWEEN_SHOWS,
} from '@/lib/market-survey/questions'

const HOUR_MS = 60 * 60 * 1000

/**
 * The market survey goes first: while it may still be shown to her, or was
 * shown in the last day, this popup stays quiet so she never gets two surveys
 * back to back.
 */
async function marketSurveyHasPriority(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  now: number
) {
  const { data: row, error } = await admin
    .from('market_survey_responses')
    .select('shows_count, last_shown_at, completed_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)

  const gapMs = MARKET_SURVEY_MIN_HOURS_BETWEEN_SHOWS * HOUR_MS
  if (row?.last_shown_at && now - new Date(row.last_shown_at).getTime() < gapMs) return true

  const marketStillRunning = now < new Date(MARKET_SURVEY_ENDS_AT).getTime()
  const marketDoneForHer = !!row && (!!row.completed_at || row.shows_count >= MARKET_SURVEY_MAX_SHOWS)
  return marketStillRunning && !marketDoneForHer
}

/**
 * Called by the popup when its delay ends; counts the showing here, the same
 * way as claimMarketSurveyShow. Any failure means no popup.
 */
export async function claimLearningSurveyShow(): Promise<{ show: boolean }> {
  try {
    const now = Date.now()
    if (now >= new Date(LEARNING_SURVEY_ENDS_AT).getTime()) return { show: false }

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
    const minAgeMs = LEARNING_SURVEY_MIN_ACCOUNT_AGE_DAYS * 24 * HOUR_MS
    if (now - new Date(user.created_at).getTime() < minAgeMs) return { show: false }

    if (await marketSurveyHasPriority(admin, userId, now)) return { show: false }

    const { data: row, error: rowError } = await admin
      .from('learning_survey_responses')
      .select('shows_count, last_shown_at, completed_at')
      .eq('user_id', userId)
      .maybeSingle()
    if (rowError) throw new Error(rowError.message)

    const lastShownAt = new Date(now).toISOString()

    if (row) {
      if (row.completed_at || row.shows_count >= LEARNING_SURVEY_MAX_SHOWS) return { show: false }
      const minGapMs = LEARNING_SURVEY_MIN_HOURS_BETWEEN_SHOWS * HOUR_MS
      if (row.last_shown_at && now - new Date(row.last_shown_at).getTime() < minGapMs) {
        return { show: false }
      }
      const { data: claimed, error } = await admin
        .from('learning_survey_responses')
        .update({ shows_count: row.shows_count + 1, last_shown_at: lastShownAt })
        .eq('user_id', userId)
        .eq('shows_count', row.shows_count)
        .select('user_id')
      if (error) throw new Error(error.message)
      if (!claimed?.length) return { show: false }
    } else {
      const { error } = await admin
        .from('learning_survey_responses')
        .insert({ user_id: userId, shows_count: 1, last_shown_at: lastShownAt })
      // Unique violation = another tab just claimed it.
      if (error) return { show: false }
    }

    return { show: true }
  } catch (error) {
    console.error('[claimLearningSurveyShow]', error instanceof Error ? error.message : error)
    return { show: false }
  }
}

export async function submitLearningSurvey(
  input: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const context = await getDashboardContext()
    if (!context) return { ok: false, error: 'יש להתחבר מחדש' }
    if (context.isImpersonating) return { ok: false, error: 'אי אפשר לענות בזמן התחזות' }

    const parsed = learningSurveySchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'נא לבחור לפחות תשובה אחת' }
    const { learnedAt, teacherName } = parsed.data

    const admin = createAdminClient()
    const { error } = await admin
      .from('learning_survey_responses')
      .update({
        completed_at: new Date().toISOString(),
        answers: { learnedAt, ...(teacherName ? { teacherName } : {}) },
      })
      .eq('user_id', context.userId)
      .is('completed_at', null)
    if (error) throw new Error(error.message)

    return { ok: true }
  } catch (error) {
    console.error('[submitLearningSurvey]', error instanceof Error ? error.message : error)
    return { ok: false, error: 'השמירה נכשלה, אפשר לנסות שוב' }
  }
}
