import { createAdminClient } from '@/lib/supabase/admin'
import {
  hasActiveSubscriptionLike,
  resolveStudioEntitlements,
} from './entitlements'
import type { StudioEntitlements, SubscriptionTierOverride } from './types'

export type StudioEntitlementUserRow = {
  trial_end_date: string | null
  subscription_tier_override: SubscriptionTierOverride | null
}

export type StudioEntitlementSubscriptionRow = {
  status: string
  current_period_end: string | null
  updated_at: string | null
}

function isMissingOverrideColumnError(message: string) {
  const lowered = message.toLowerCase()
  return (
    message.includes('subscription_tier_override') &&
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
        .select('trial_end_date, subscription_tier_override')
        .eq('id', userId)
        .maybeSingle(),
      admin
        .from('subscriptions')
        .select('status, current_period_end, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  const hasActiveSubscription = hasActiveSubscriptionLike(
    latestSubscription as StudioEntitlementSubscriptionRow | null,
    now
  )

  if (userError && isMissingOverrideColumnError(userError.message)) {
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
      now,
    })
  }

  if (userError || !user) {
    // Unknown user — never grant PRO. Resolver treats a null trial as FREE.
    return resolveStudioEntitlements({
      trialEndDate: null,
      subscriptionTierOverride: null,
      hasActiveSubscription,
      now,
    })
  }

  const row = user as StudioEntitlementUserRow
  return resolveStudioEntitlements({
    trialEndDate: row.trial_end_date,
    subscriptionTierOverride: row.subscription_tier_override,
    hasActiveSubscription,
    now,
  })
}
