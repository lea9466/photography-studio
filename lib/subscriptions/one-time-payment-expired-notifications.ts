import { sendOneTimePlanExpiredEmail } from '@/lib/email/resend'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Day-zero "moved to free plan" notification for a one-time-payment
 * subscription that just lapsed. Mirrors lib/trial/trial-expired-notifications.ts,
 * keyed on `subscriptions` (payment_type = 'one_time') instead of
 * `users.trial_end_date`. Access itself already lapses on its own —
 * `hasActiveSubscription` in lib/payments/subscription-service.ts compares
 * `current_period_end` to now — this job only sends the email.
 */
export type OneTimePaymentExpiredCandidate = {
  id: string
  userId: string
  email: string
  name: string | null
  slug: string | null
}

export type OneTimePaymentExpiredSummary = {
  enabled: boolean
  status: 'disabled' | 'completed'
  candidates: number
  claimed: number
  sent: number
  skipped: number
  failed: number
}

/** Only the exact string "true" enables the day-zero email. */
export function isOneTimePaymentExpiredEmailEnabled() {
  return process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED === 'true'
}

function disabledSummary(): OneTimePaymentExpiredSummary {
  return { enabled: false, status: 'disabled', candidates: 0, claimed: 0, sent: 0, skipped: 0, failed: 0 }
}

export type OneTimePaymentExpiredDeps = {
  listCandidates: (now: Date) => Promise<OneTimePaymentExpiredCandidate[]>
  claimNotification: (subscriptionId: string) => Promise<string | null>
  releaseClaim: (subscriptionId: string, claimedAt: string) => Promise<void>
  sendNotification: (input: { name: string; email: string; slug: string | null }) => Promise<void>
  now?: () => Date
}

export async function processOneTimePaymentExpiredNotifications(
  deps: OneTimePaymentExpiredDeps
): Promise<OneTimePaymentExpiredSummary> {
  const now = deps.now?.() ?? new Date()
  const candidates = await deps.listCandidates(now)

  const summary: OneTimePaymentExpiredSummary = {
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

    const claimedAt = await deps.claimNotification(candidate.id)
    if (!claimedAt) {
      summary.skipped += 1
      continue
    }
    summary.claimed += 1

    try {
      await deps.sendNotification({
        name: candidate.name?.trim() || 'שם',
        email: candidate.email.trim(),
        slug: candidate.slug?.trim() || null,
      })
      summary.sent += 1
    } catch (error) {
      await deps.releaseClaim(candidate.id, claimedAt)
      summary.failed += 1
      console.error('[one-time-payment-expired-notifications] send failed', {
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

export async function runOneTimePaymentExpiredNotifications(): Promise<OneTimePaymentExpiredSummary> {
  if (!isOneTimePaymentExpiredEmailEnabled()) {
    const summary = disabledSummary()
    console.info('One-time payment expired notifications disabled.', summary)
    return summary
  }

  const admin = createAdminClient()

  const summary = await processOneTimePaymentExpiredNotifications({
    async listCandidates(now) {
      const { data, error } = await admin
        .from('subscriptions')
        .select('id, user_id, current_period_end')
        .eq('payment_type', 'one_time')
        .eq('status', 'active')
        .is('one_time_expired_email_sent_at', null)
        .lt('current_period_end', now.toISOString())

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
          }
        })
        .filter((row): row is OneTimePaymentExpiredCandidate => row !== null)
    },

    async claimNotification(subscriptionId) {
      const claimedAt = new Date().toISOString()
      const { data, error } = await admin
        .from('subscriptions')
        .update({ one_time_expired_email_sent_at: claimedAt })
        .eq('id', subscriptionId)
        .is('one_time_expired_email_sent_at', null)
        .select('one_time_expired_email_sent_at')
        .maybeSingle()

      if (error) throw error
      return data?.one_time_expired_email_sent_at ?? null
    },

    async releaseClaim(subscriptionId, claimedAt) {
      const { error } = await admin
        .from('subscriptions')
        .update({ one_time_expired_email_sent_at: null })
        .eq('id', subscriptionId)
        .eq('one_time_expired_email_sent_at', claimedAt)

      if (error) throw error
    },

    async sendNotification(input) {
      const result = await sendOneTimePlanExpiredEmail(input)
      if (!result.sent) throw new Error('EmailProviderUnavailable')
    },
  })

  console.info('[one-time-payment-expired-notifications] invocation summary', summary)
  return summary
}
