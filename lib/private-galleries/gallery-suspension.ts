import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateGalleryEntitlements } from '@/lib/private-galleries/loader'
import { hasActiveSubscriptionLike } from '@/lib/subscriptions/entitlements'

/** Days a lapsed private-gallery subscription is honoured before galleries suspend. */
export const SUSPENSION_GRACE_DAYS = 15

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * True once a lapsed subscription is far enough past its end that the grace is
 * over and the galleries should suspend. `lapseAt` is the subscription's
 * `current_period_end` (or `updated_at` as a fallback). Exported for tests.
 */
export function isPastSuspensionGrace(lapseAt: string | null, now: number): boolean {
  if (!lapseAt) return false
  return new Date(lapseAt).getTime() + SUSPENSION_GRACE_DAYS * DAY_MS <= now
}

/**
 * Clear the suspension on all of a user's client galleries — call right after a
 * private-gallery subscription (re)activates (mirrors
 * reactivateSuspendedCustomDomains). Re-checks entitlement so it is always safe
 * to call: a no-op if she is still on free, or has nothing suspended.
 */
export async function reactivateSuspendedClientGalleries(userId: string): Promise<void> {
  const pg = await getPrivateGalleryEntitlements(userId).catch(() => null)
  if (!pg || pg.source === 'free') return

  const admin = createAdminClient()
  const { error } = await admin
    .from('galleries')
    .update({ suspended_at: null } as never)
    .eq('user_id', userId)
    .eq('gallery_type', 'selection')
    .not('suspended_at', 'is', null)

  if (error) {
    console.error('[gallery-suspension] reactivate failed', {
      userId,
      message: error.message,
    })
  }
}

type LapsedSubRow = {
  status: string | null
  current_period_end: string | null
  updated_at: string | null
}

/**
 * Daily reconciliation sweep. A lapse has no single trigger moment (a
 * subscription can expire passively), so this re-derives entitlement the same
 * way the rest of the app does and suspends where it has run out — mirroring
 * suspendCustomDomainsWithLapsedEntitlement.
 *
 * A studio whose private-gallery subscription lapsed more than
 * SUSPENSION_GRACE_DAYS ago has ALL her client galleries suspended (client and
 * photographer both blocked) until she renews. A studio that never had a
 * private-gallery subscription (pure free) is left alone — only the create
 * limit applies to her.
 */
export async function suspendClientGalleriesWithLapsedSubscription(): Promise<{
  checked: number
  suspended: number
}> {
  const admin = createAdminClient()
  const now = Date.now()

  // Distinct owners of at least one not-yet-suspended client gallery.
  const userIds = new Set<string>()
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await admin
      .from('galleries')
      .select('user_id')
      .eq('gallery_type', 'selection')
      .is('suspended_at', null)
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`failed to list client galleries: ${error.message}`)
    const rows = data ?? []
    for (const r of rows) {
      const uid = (r as { user_id: string | null }).user_id
      if (uid) userIds.add(uid)
    }
    if (rows.length < pageSize) break
    from += pageSize
  }

  let suspended = 0
  for (const userId of userIds) {
    const pg = await getPrivateGalleryEntitlements(userId).catch(() => null)
    // Still entitled (active subscription, or an admin override to a paid tier).
    if (!pg || pg.source !== 'free') continue

    const { data: subData } = await admin
      .from('subscriptions')
      .select('status, current_period_end, updated_at')
      .eq('user_id', userId)
      .eq('product', 'private_galleries')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const sub = subData as LapsedSubRow | null
    if (!sub) continue // pure free user — never subscribed
    if (hasActiveSubscriptionLike(sub, new Date(now))) continue // safety re-check

    if (!isPastSuspensionGrace(sub.current_period_end ?? sub.updated_at, now)) continue

    const { error: updateError } = await admin
      .from('galleries')
      .update({ suspended_at: new Date(now).toISOString() } as never)
      .eq('user_id', userId)
      .eq('gallery_type', 'selection')
      .is('suspended_at', null)
    if (updateError) {
      console.error('[gallery-suspension] suspend failed', {
        userId,
        message: updateError.message,
      })
      continue
    }
    suspended += 1

    try {
      const { sendClientGalleriesSuspendedEmail } = await import('@/lib/email/resend')
      await sendClientGalleriesSuspendedEmail(userId)
    } catch (error) {
      console.error('[gallery-suspension] suspension email failed', {
        userId,
        reason: error instanceof Error ? error.name : 'unknown',
      })
    }
  }

  return { checked: userIds.size, suspended }
}
