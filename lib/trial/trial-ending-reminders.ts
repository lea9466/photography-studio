import {
  sendTrialEndingReminderEmail,
  sendTrialUpdateEmail,
} from '@/lib/email/resend'
import { isPaymentsCheckoutEnabled } from '@/lib/payments/flags'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * `update` — soft status email while checkout is closed (≤3 days remaining).
 * `payment` — payment CTA email once checkout is open (exact UTC day+3 window).
 */
export type TrialReminderMode = 'update' | 'payment'

export type TrialEndingReminderCandidate = {
  id: string
  email: string
  name: string | null
  trial_end_date: string
}

export type TrialEndingReminderSummary = {
  /** Whether this invocation was allowed to run the job. */
  enabled: boolean
  /** Selected reminder mode for this invocation; null when disabled. */
  mode: TrialReminderMode | null
  /** disabled = flag off (no work); completed = job ran for this invocation. */
  status: 'disabled' | 'completed'
  candidates: number
  claimed: number
  sent: number
  skipped: number
  failed: number
}

export type TrialEndingReminderWindow = {
  /** Inclusive lower bound for trial_end_date. */
  windowStart: Date
  /** Exclusive upper bound for trial_end_date. */
  windowEnd: Date
}

/** Checkout off → update email; checkout on → payment reminder. */
export function getTrialReminderMode(): TrialReminderMode {
  return isPaymentsCheckoutEnabled() ? 'payment' : 'update'
}

/**
 * Stable UTC windows used by the daily cron.
 * - update: trial_end_date in [max(now, start-of-today), start-of-today+4d)
 *   → within [today, today+4d) and trial not yet expired
 * - payment: trial_end_date in [start-of-today+3d, start-of-today+4d)
 */
export function getTrialEndingReminderWindow(
  now = new Date(),
  mode: TrialReminderMode = getTrialReminderMode()
): TrialEndingReminderWindow {
  const startOfTodayUtcMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  const dayMs = 24 * 60 * 60 * 1000

  if (mode === 'payment') {
    return {
      windowStart: new Date(startOfTodayUtcMs + 3 * dayMs),
      windowEnd: new Date(startOfTodayUtcMs + 4 * dayMs),
    }
  }

  // Exclude already-expired trials while staying inside [today, today+4d).
  return {
    windowStart: new Date(Math.max(now.getTime(), startOfTodayUtcMs)),
    windowEnd: new Date(startOfTodayUtcMs + 4 * dayMs),
  }
}

export function isTrialEndInReminderWindow(
  trialEndDate: string | Date,
  now = new Date(),
  mode: TrialReminderMode = getTrialReminderMode()
) {
  const end = new Date(trialEndDate).getTime()
  const { windowStart, windowEnd } = getTrialEndingReminderWindow(now, mode)
  return end >= windowStart.getTime() && end < windowEnd.getTime()
}

/** Only the exact string "true" enables reminder emails. */
export function isTrialEndingRemindersEnabled() {
  return process.env.TRIAL_ENDING_REMINDERS_ENABLED === 'true'
}

function disabledReminderSummary(): TrialEndingReminderSummary {
  return {
    enabled: false,
    mode: null,
    status: 'disabled',
    candidates: 0,
    claimed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  }
}

export type TrialEndingReminderDeps = {
  mode: TrialReminderMode
  listCandidates: (
    window: TrialEndingReminderWindow
  ) => Promise<TrialEndingReminderCandidate[]>
  /** Batch lookup of users with a local active subscription. */
  getActiveSubscriptionUserIds: (userIds: string[]) => Promise<Set<string>>
  /** Atomic claim. Returns the claimed timestamp, or null if already claimed. */
  claimReminder: (userId: string) => Promise<string | null>
  /**
   * Release only the claim written by this run.
   * Must no-op if another run already replaced the timestamp.
   */
  releaseClaim: (userId: string, claimedAt: string) => Promise<void>
  sendReminder: (input: {
    name: string
    email: string
    mode: TrialReminderMode
  }) => Promise<void>
  now?: () => Date
}

export async function processTrialEndingReminders(
  deps: TrialEndingReminderDeps
): Promise<TrialEndingReminderSummary> {
  const now = deps.now?.() ?? new Date()
  const window = getTrialEndingReminderWindow(now, deps.mode)
  const candidates = await deps.listCandidates(window)
  const activeUserIds = await deps.getActiveSubscriptionUserIds(
    candidates.map((candidate) => candidate.id)
  )

  const summary: TrialEndingReminderSummary = {
    enabled: true,
    mode: deps.mode,
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

    if (activeUserIds.has(candidate.id)) {
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
      // Re-check after claim so a concurrent activation still skips send.
      const stillActive = await deps.getActiveSubscriptionUserIds([candidate.id])
      if (stillActive.has(candidate.id)) {
        await deps.releaseClaim(candidate.id, claimedAt)
        summary.claimed -= 1
        summary.skipped += 1
        continue
      }

      await deps.sendReminder({
        name: candidate.name?.trim() || 'שם',
        email: candidate.email.trim(),
        mode: deps.mode,
      })
      summary.sent += 1
    } catch (error) {
      await deps.releaseClaim(candidate.id, claimedAt)
      summary.failed += 1
      console.error('[trial-ending-reminders] send failed', {
        reason: error instanceof Error ? error.name : 'unknown',
        mode: deps.mode,
      })
    }
  }

  // Return a plain snapshot so callers cannot observe later mutation.
  return {
    enabled: summary.enabled,
    mode: summary.mode,
    status: summary.status,
    candidates: summary.candidates,
    claimed: summary.claimed,
    sent: summary.sent,
    skipped: summary.skipped,
    failed: summary.failed,
  }
}

export async function runTrialEndingReminders(): Promise<TrialEndingReminderSummary> {
  if (!isTrialEndingRemindersEnabled()) {
    const summary = disabledReminderSummary()
    console.info('Trial reminders disabled.', {
      enabled: summary.enabled,
      status: summary.status,
      candidates: summary.candidates,
      claimed: summary.claimed,
      sent: summary.sent,
      skipped: summary.skipped,
      failed: summary.failed,
    })
    return summary
  }

  const mode = getTrialReminderMode()
  console.info('[trial-ending-reminders] mode selected', { mode })

  const admin = createAdminClient()

  const summary = await processTrialEndingReminders({
    mode,

    async listCandidates(window) {
      const { data, error } = await admin
        .from('users')
        .select('id, email, name, trial_end_date')
        .is('trial_ending_email_sent_at', null)
        .not('email', 'is', null)
        .neq('email', '')
        .gte('trial_end_date', window.windowStart.toISOString())
        .lt('trial_end_date', window.windowEnd.toISOString())

      if (error) throw error
      return (data ?? []) as TrialEndingReminderCandidate[]
    },

    async getActiveSubscriptionUserIds(userIds) {
      if (userIds.length === 0) return new Set()

      const { data, error } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .in('user_id', userIds)

      if (error) throw error
      return new Set((data ?? []).map((row) => row.user_id))
    },

    async claimReminder(userId) {
      const claimedAt = new Date().toISOString()
      const { data, error } = await admin
        .from('users')
        .update({ trial_ending_email_sent_at: claimedAt })
        .eq('id', userId)
        .is('trial_ending_email_sent_at', null)
        .select('trial_ending_email_sent_at')
        .maybeSingle()

      if (error) throw error
      return data?.trial_ending_email_sent_at ?? null
    },

    async releaseClaim(userId, claimedAt) {
      const { error } = await admin
        .from('users')
        .update({ trial_ending_email_sent_at: null })
        .eq('id', userId)
        .eq('trial_ending_email_sent_at', claimedAt)

      if (error) throw error
    },

    async sendReminder(input) {
      const result =
        input.mode === 'payment'
          ? await sendTrialEndingReminderEmail({
              name: input.name,
              email: input.email,
            })
          : await sendTrialUpdateEmail({
              name: input.name,
              email: input.email,
            })
      // Dev stub must not leave a permanent claim without a real send.
      if (!result.sent) {
        throw new Error('EmailProviderUnavailable')
      }
    },
  })

  console.info('[trial-ending-reminders] invocation summary', {
    enabled: summary.enabled,
    mode: summary.mode,
    status: summary.status,
    candidates: summary.candidates,
    claimed: summary.claimed,
    sent: summary.sent,
    skipped: summary.skipped,
    failed: summary.failed,
  })
  return summary
}
