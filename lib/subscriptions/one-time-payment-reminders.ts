import { sendOneTimePlanEndingReminderEmail } from '@/lib/email/resend'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * "3 days left" reminder for a one-time-payment subscription (see
 * lib/payments/payment-service.ts `createOneTimeCheckout` — no standing
 * authorization, so nothing renews automatically). Mirrors the claim/dedupe
 * shape of lib/trial/trial-ending-reminders.ts, but keyed on `subscriptions`
 * (payment_type = 'one_time') instead of `users.trial_end_date`, since a
 * one-time grant is per-subscription, not per-user.
 */
export type OneTimePaymentReminderCandidate = {
  id: string
  userId: string
  email: string
  name: string | null
  slug: string | null
  current_period_end: string
}

export type OneTimePaymentReminderSummary = {
  enabled: boolean
  status: 'disabled' | 'completed'
  candidates: number
  claimed: number
  sent: number
  skipped: number
  failed: number
}

export type OneTimePaymentReminderWindow = {
  windowStart: Date
  windowEnd: Date
}

/** Only the exact string "true" enables reminder emails. */
export function isOneTimePaymentRemindersEnabled() {
  return process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED === 'true'
}

/** UTC day+3 inclusive to day+4 exclusive — same shape as the trial "payment" window. */
export function getOneTimePaymentReminderWindow(
  now = new Date()
): OneTimePaymentReminderWindow {
  const startOfTodayUtcMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  const dayMs = 24 * 60 * 60 * 1000
  return {
    windowStart: new Date(startOfTodayUtcMs + 3 * dayMs),
    windowEnd: new Date(startOfTodayUtcMs + 4 * dayMs),
  }
}

export function isOneTimePaymentEndInReminderWindow(
  currentPeriodEnd: string | Date,
  now = new Date()
) {
  const end = new Date(currentPeriodEnd).getTime()
  const { windowStart, windowEnd } = getOneTimePaymentReminderWindow(now)
  return end >= windowStart.getTime() && end < windowEnd.getTime()
}

function disabledSummary(): OneTimePaymentReminderSummary {
  return { enabled: false, status: 'disabled', candidates: 0, claimed: 0, sent: 0, skipped: 0, failed: 0 }
}

export type OneTimePaymentReminderDeps = {
  listCandidates: (
    window: OneTimePaymentReminderWindow
  ) => Promise<OneTimePaymentReminderCandidate[]>
  claimReminder: (subscriptionId: string) => Promise<string | null>
  releaseClaim: (subscriptionId: string, claimedAt: string) => Promise<void>
  sendReminder: (input: { name: string; email: string; slug: string | null }) => Promise<void>
  now?: () => Date
}

export async function processOneTimePaymentReminders(
  deps: OneTimePaymentReminderDeps
): Promise<OneTimePaymentReminderSummary> {
  const now = deps.now?.() ?? new Date()
  const window = getOneTimePaymentReminderWindow(now)
  const candidates = await deps.listCandidates(window)

  const summary: OneTimePaymentReminderSummary = {
    enabled: true,
    status: 'completed',
    candidates: candidates.length,
    claimed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  }

  for (const candidate of candidates) {
    if (!candidate.email?.trim()) {
      summary.skipped += 1
      continue
    }

    const claimedAt = await deps.claimReminder(candidate.id)
    if (!claimedAt) {
      summary.skipped += 1
      continue
    }
    summary.claimed += 1

    try {
      await deps.sendReminder({
        name: candidate.name?.trim() || 'שם',
        email: candidate.email.trim(),
        slug: candidate.slug?.trim() || null,
      })
      summary.sent += 1
    } catch (error) {
      await deps.releaseClaim(candidate.id, claimedAt)
      summary.failed += 1
      console.error('[one-time-payment-reminders] send failed', {
        reason: error instanceof Error ? error.name : 'unknown',
      })
    }
  }

  return {
    enabled: summary.enabled,
    status: summary.status,
    candidates: summary.candidates,
    claimed: summary.claimed,
    sent: summary.sent,
    skipped: summary.skipped,
    failed: summary.failed,
  }
}

export async function runOneTimePaymentReminders(): Promise<OneTimePaymentReminderSummary> {
  if (!isOneTimePaymentRemindersEnabled()) {
    const summary = disabledSummary()
    console.info('One-time payment reminders disabled.', summary)
    return summary
  }

  const admin = createAdminClient()

  const summary = await processOneTimePaymentReminders({
    async listCandidates(window) {
      const { data, error } = await admin
        .from('subscriptions')
        .select('id, user_id, current_period_end')
        .eq('payment_type', 'one_time')
        .eq('status', 'active')
        .is('one_time_reminder_sent_at', null)
        .gte('current_period_end', window.windowStart.toISOString())
        .lt('current_period_end', window.windowEnd.toISOString())

      if (error) throw error
      const rows = data ?? []
      if (rows.length === 0) return []

      const { data: users, error: usersError } = await admin
        .from('users')
        .select('id, email, name, slug')
        .in('id', rows.map((row) => row.user_id))
      if (usersError) throw usersError

      const usersById = new Map((users ?? []).map((user) => [user.id, user]))
      return rows
        .map((row) => {
          const user = usersById.get(row.user_id)
          if (!user?.email) return null
          return {
            id: row.id,
            userId: row.user_id,
            email: user.email,
            name: user.name ?? null,
            slug: user.slug ?? null,
            current_period_end: row.current_period_end as string,
          }
        })
        .filter((row): row is OneTimePaymentReminderCandidate => row !== null)
    },

    async claimReminder(subscriptionId) {
      const claimedAt = new Date().toISOString()
      const { data, error } = await admin
        .from('subscriptions')
        .update({ one_time_reminder_sent_at: claimedAt })
        .eq('id', subscriptionId)
        .is('one_time_reminder_sent_at', null)
        .select('one_time_reminder_sent_at')
        .maybeSingle()

      if (error) throw error
      return data?.one_time_reminder_sent_at ?? null
    },

    async releaseClaim(subscriptionId, claimedAt) {
      const { error } = await admin
        .from('subscriptions')
        .update({ one_time_reminder_sent_at: null })
        .eq('id', subscriptionId)
        .eq('one_time_reminder_sent_at', claimedAt)

      if (error) throw error
    },

    async sendReminder(input) {
      const result = await sendOneTimePlanEndingReminderEmail(input)
      if (!result.sent) throw new Error('EmailProviderUnavailable')
    },
  })

  console.info('[one-time-payment-reminders] invocation summary', summary)
  return summary
}
