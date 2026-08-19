import { sendTrialExpiredEmail } from '@/lib/email/resend'
import { isPaymentsCheckoutEnabled } from '@/lib/payments/flags'
import { createAdminClient } from '@/lib/supabase/admin'

export type TrialExpiredCandidate = {
  id: string
  email: string
  name: string | null
  trial_end_date: string
  slug: string | null
}

export type TrialExpiredNotificationSummary = {
  enabled: boolean
  status: 'disabled' | 'completed'
  candidates: number
  claimed: number
  sent: number
  skipped: number
  failed: number
}

/** Only the exact string "true" enables the day-zero trial-expired email. */
export function isTrialExpiredEmailEnabled() {
  return process.env.TRIAL_EXPIRED_EMAIL_ENABLED === 'true'
}

function disabledSummary(): TrialExpiredNotificationSummary {
  return { enabled: false, status: 'disabled', candidates: 0, claimed: 0, sent: 0, skipped: 0, failed: 0 }
}

export type TrialExpiredNotificationDeps = {
  listCandidates: (now: Date) => Promise<TrialExpiredCandidate[]>
  getActiveSubscriptionUserIds: (userIds: string[]) => Promise<Set<string>>
  claimNotification: (userId: string) => Promise<string | null>
  releaseClaim: (userId: string, claimedAt: string) => Promise<void>
  sendNotification: (input: {
    name: string
    email: string
    slug: string | null
  }) => Promise<void>
  /**
   * Locks dashboard + public-site access for a studio (sets
   * is_site_unavailable — see lib/site-access/dashboard-lock.ts). Only ever
   * called right after sendNotification succeeds for that same candidate, so
   * a studio is never locked without having already received the day-zero
   * email first. Left undefined by the caller when real checkout isn't live
   * yet (see runTrialExpiredNotifications) — locking someone out with no way
   * to actually pay their way back in would be a dead end.
   */
  lockSiteAccess?: (userId: string) => Promise<void>
  now?: () => Date
}

/**
 * Mirrors processTrialEndingReminders' claim/dedupe shape (lib/trial/trial-ending-reminders.ts)
 * but for a distinct, one-time "trial ended, moved to FREE" notification —
 * unbounded window (trial_end_date in the past) since the dedupe column
 * (trial_expired_email_sent_at) alone guarantees at most one send per user.
 */
export async function processTrialExpiredNotifications(
  deps: TrialExpiredNotificationDeps
): Promise<TrialExpiredNotificationSummary> {
  const now = deps.now?.() ?? new Date()
  const candidates = await deps.listCandidates(now)
  const activeUserIds = await deps.getActiveSubscriptionUserIds(
    candidates.map((candidate) => candidate.id)
  )

  const summary: TrialExpiredNotificationSummary = {
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
    if (activeUserIds.has(candidate.id)) {
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
      const stillActive = await deps.getActiveSubscriptionUserIds([candidate.id])
      if (stillActive.has(candidate.id)) {
        await deps.releaseClaim(candidate.id, claimedAt)
        summary.claimed -= 1
        summary.skipped += 1
        continue
      }

      await deps.sendNotification({
        name: candidate.name?.trim() || 'שם',
        email: candidate.email.trim(),
        slug: candidate.slug?.trim() || null,
      })
      summary.sent += 1

      if (deps.lockSiteAccess) {
        try {
          await deps.lockSiteAccess(candidate.id)
        } catch (lockError) {
          // The email already sent (and is claimed/deduped), so this must
          // not throw into the outer catch — that would treat a successful
          // send as a failure and retry-release the email claim. A studio
          // that fails to lock here just stays reachable until fixed
          // manually from /manage; it's logged so that's visible.
          console.error('[trial-expired-notifications] site lock failed', {
            userId: candidate.id,
            reason: lockError instanceof Error ? lockError.name : 'unknown',
          })
        }
      }
    } catch (error) {
      await deps.releaseClaim(candidate.id, claimedAt)
      summary.failed += 1
      console.error('[trial-expired-notifications] send failed', {
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

export async function runTrialExpiredNotifications(): Promise<TrialExpiredNotificationSummary> {
  if (!isTrialExpiredEmailEnabled()) {
    const summary = disabledSummary()
    console.info('Trial-expired notifications disabled.', summary)
    return summary
  }

  const admin = createAdminClient()
  const checkoutEnabled = isPaymentsCheckoutEnabled()

  const summary = await processTrialExpiredNotifications({
    async listCandidates(now) {
      const { data, error } = await admin
        .from('users')
        .select('id, email, name, trial_end_date, slug')
        .is('trial_expired_email_sent_at', null)
        .not('email', 'is', null)
        .neq('email', '')
        .lt('trial_end_date', now.toISOString())

      if (error) throw error
      return (data ?? []) as TrialExpiredCandidate[]
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

    async claimNotification(userId) {
      const claimedAt = new Date().toISOString()
      const { data, error } = await admin
        .from('users')
        .update({ trial_expired_email_sent_at: claimedAt })
        .eq('id', userId)
        .is('trial_expired_email_sent_at', null)
        .select('trial_expired_email_sent_at')
        .maybeSingle()

      if (error) throw error
      return data?.trial_expired_email_sent_at ?? null
    },

    async releaseClaim(userId, claimedAt) {
      const { error } = await admin
        .from('users')
        .update({ trial_expired_email_sent_at: null })
        .eq('id', userId)
        .eq('trial_expired_email_sent_at', claimedAt)

      if (error) throw error
    },

    async sendNotification(input) {
      const result = await sendTrialExpiredEmail({
        name: input.name,
        email: input.email,
        checkoutEnabled,
        slug: input.slug,
      })
      if (!result.sent) {
        throw new Error('EmailProviderUnavailable')
      }
    },

    // Real checkout must be live before locking anyone out — otherwise
    // /dashboard/subscription (the one page a locked studio can still reach)
    // has no actual way for her to pay and get access back.
    lockSiteAccess: checkoutEnabled
      ? async (userId: string) => {
          const { error } = await admin
            .from('users')
            .update({ is_site_unavailable: true })
            .eq('id', userId)
          if (error) throw error
        }
      : undefined,
  })

  console.info('[trial-expired-notifications] invocation summary', summary)
  return summary
}
