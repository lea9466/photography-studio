import { createAdminClient } from '@/lib/supabase/admin'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'

/**
 * Flips any of this user's `suspended_billing` custom domains back to
 * `active` — call this right after granting entitlement (a real subscription
 * activates, or the standalone addon is purchased; see the SUMIT return
 * route's `handleCheckout` / `handleOneTimeCheckout` / `subscribeWithToken`
 * in lib/payments/payment-service.ts and `handleCustomDomainAddonCheckout`).
 * Reactivation always happens synchronously at the moment access is
 * (re)granted — there's a single clear trigger for it, unlike a lapse (see
 * `suspendCustomDomainsWithLapsedEntitlement` below), so it never needs to
 * wait for the reconciliation cron. Safe to call for a user with no
 * suspended domain at all — a plain no-op (0 rows matched).
 */
export async function reactivateSuspendedCustomDomains(userId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('custom_domains')
    .update({ status: 'active', updated_at: new Date().toISOString() } as never)
    .eq('user_id', userId)
    .eq('status', 'suspended_billing')

  if (error) {
    console.error('[custom-domain-suspension] reactivate failed', {
      userId,
      message: error.message,
    })
  }
}

/**
 * Daily reconciliation sweep (see scripts/suspend-lapsed-custom-domains.ts
 * and its cron wiring) — the safety net for the *lapse* direction, which
 * (unlike granting access) has no single trigger moment to hook: a
 * subscription can lapse passively (trial ran out with no conversion, a
 * renewal charge failed and the 7-day grace in hasActiveSubscriptionLike
 * expired) with nothing in this codebase reacting at that exact instant.
 * Re-derives entitlement via the SAME resolver every other part of the app
 * uses (getStudioEntitlements) rather than re-implementing subscription-status
 * logic here — the domain-serving decision must never drift from what the
 * dashboard itself shows as that studio's current plan.
 *
 * Only ever touches 'active' rows — 'pending'/'pending_dns'/'error'/'deleted'
 * are untouched (nothing to suspend), and an already-'suspended_billing' row
 * is left alone too (no entitlement-regained check here; that's
 * reactivateSuspendedCustomDomains's job, triggered by an actual purchase).
 */
export async function suspendCustomDomainsWithLapsedEntitlement(): Promise<{
  checked: number
  suspended: number
}> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('custom_domains')
    .select('id, user_id')
    .eq('status', 'active')

  if (error) throw new Error(`failed to list active custom domains: ${error.message}`)

  const rows = (data ?? []) as { id: string; user_id: string }[]
  let suspended = 0

  for (const row of rows) {
    const entitlements = await getStudioEntitlements(row.user_id)
    if (entitlements.features.custom_domain) continue

    const { error: updateError } = await admin
      .from('custom_domains')
      .update({ status: 'suspended_billing', updated_at: new Date().toISOString() } as never)
      .eq('id', row.id)
      .eq('status', 'active') // re-check: don't clobber a row reactivated mid-sweep

    if (updateError) {
      console.error('[custom-domain-suspension] suspend failed', {
        domainId: row.id,
        userId: row.user_id,
        message: updateError.message,
      })
      continue
    }
    suspended += 1
  }

  return { checked: rows.length, suspended }
}
