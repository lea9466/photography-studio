import { createAdminClient } from '@/lib/supabase/admin'
import { isPaymentsCheckoutEnabled } from '@/lib/payments/flags'
import {
  hasActiveSubscriptionLike,
  resolveStudioEntitlements,
} from './entitlements'
import type { StudioEntitlements, SubscriptionTierOverride } from './types'

export type StudioEntitlementUserRow = {
  trial_end_date: string | null
  subscription_tier_override: SubscriptionTierOverride | null
  custom_domain_addon_purchased_at: string | null
}

export type StudioEntitlementSubscriptionRow = {
  status: string
  current_period_end: string | null
  updated_at: string | null
}

/** Matches a PostgREST "unknown column" error for either optional column this
 *  loader selects speculatively — `subscription_tier_override` and the newer
 *  `custom_domain_addon_purchased_at` — so a not-yet-applied migration in some
 *  environment degrades to safe defaults instead of failing entitlements
 *  resolution outright (same defensive posture for both, since they ship
 *  together and either being absent means the same "older schema" case). */
function isMissingOptionalColumnError(message: string) {
  const lowered = message.toLowerCase()
  const mentionsKnownOptionalColumn =
    message.includes('subscription_tier_override') || message.includes('custom_domain_addon_purchased_at')
  return (
    mentionsKnownOptionalColumn &&
    (lowered.includes('column') ||
      lowered.includes('does not exist') ||
      lowered.includes('pgrest204') ||
      message.includes('42703'))
  )
}

/**
 * Server-side loader for the single entitlement resolver.
 *
 * Used by dashboard pages, server actions, API routes and (via a lightweight
 * projection) by admin queries. If the `subscription_tier_override` column is
 * missing (migration not yet applied in this environment) it falls back to
 * auto behaviour instead of failing hard.
 */
export async function getStudioEntitlements(
  userId: string,
  now = new Date()
): Promise<StudioEntitlements> {
  const admin = createAdminClient()

  const [{ data: user, error: userError }, { data: latestSubscription }] =
    await Promise.all([
      admin
        .from('users')
        .select('trial_end_date, subscription_tier_override, custom_domain_addon_purchased_at')
        .eq('id', userId)
        .maybeSingle(),
      admin
        .from('subscriptions')
        .select('status, current_period_end, updated_at')
        .eq('user_id', userId)
        .in('status', ['active', 'past_due', 'payment_failed'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  const hasActiveSubscription = hasActiveSubscriptionLike(
    latestSubscription as StudioEntitlementSubscriptionRow | null,
    now
  )
  const paymentsCheckoutEnabled = isPaymentsCheckoutEnabled()

  if (userError && isMissingOptionalColumnError(userError.message)) {
    const { data: fallback } = await admin
      .from('users')
      .select('trial_end_date')
      .eq('id', userId)
      .maybeSingle()
    const row = fallback as { trial_end_date: string | null } | null
    return resolveStudioEntitlements({
      trialEndDate: row?.trial_end_date ?? null,
      subscriptionTierOverride: null,
      hasActiveSubscription,
      paymentsCheckoutEnabled,
      hasCustomDomainAddon: false,
      now,
    })
  }

  if (userError || !user) {
    // Unknown user — never grant PRO, not even the pre-launch grace (that
    // grace only applies to real 'auto' accounts).
    return resolveStudioEntitlements({
      trialEndDate: null,
      subscriptionTierOverride: 'free',
      hasActiveSubscription,
      paymentsCheckoutEnabled,
      hasCustomDomainAddon: false,
      now,
    })
  }

  const row = user as StudioEntitlementUserRow
  return resolveStudioEntitlements({
    trialEndDate: row.trial_end_date,
    subscriptionTierOverride: row.subscription_tier_override,
    hasActiveSubscription,
    paymentsCheckoutEnabled,
    hasCustomDomainAddon: row.custom_domain_addon_purchased_at != null,
    now,
  })
}
