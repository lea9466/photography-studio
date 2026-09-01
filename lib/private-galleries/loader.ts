import { createAdminClient } from '@/lib/supabase/admin'
import { pickLimitsForTier, resolvePrivateGalleryTier, type PrivateGalleryTierRow } from './entitlements'
import type { PrivateGalleryEntitlements, PrivateGalleryTierOverride } from './types'

/**
 * Server-side loader for the private-gallery entitlement resolver. Mirrors
 * lib/subscriptions/loader.ts, but for the fully independent private-gallery
 * subscription product — never reads/writes the public-site subscription.
 */
export async function getPrivateGalleryEntitlements(
  userId: string,
  now = new Date()
): Promise<PrivateGalleryEntitlements> {
  const admin = createAdminClient()

  const [{ data: user }, { data: subscription }, { data: tierRows, error: tierRowsError }] =
    await Promise.all([
      admin
        .from('users')
        .select('private_gallery_tier_override, free_private_gallery_created')
        .eq('id', userId)
        .maybeSingle(),
      admin
        .from('subscriptions')
        .select('plan_id, status, current_period_end, updated_at')
        .eq('user_id', userId)
        .eq('product', 'private_galleries')
        .in('status', ['active', 'past_due', 'payment_failed'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from('private_gallery_tiers').select('tier, max_galleries, max_photos_per_gallery, is_lifetime_cap'),
    ])

  if (tierRowsError || !tierRows) {
    throw new Error(tierRowsError?.message ?? 'private_gallery_tiers is empty')
  }

  let planCode: string | null = null
  if (subscription?.plan_id) {
    const { data: plan } = await admin
      .from('subscription_plans')
      .select('code')
      .eq('id', subscription.plan_id)
      .maybeSingle()
    planCode = plan?.code ?? null
  }

  const { tier, source } = resolvePrivateGalleryTier({
    tierOverride: (user?.private_gallery_tier_override ?? 'auto') as PrivateGalleryTierOverride,
    subscription,
    planCode,
    now,
  })

  const limits = pickLimitsForTier(tier, tierRows as PrivateGalleryTierRow[])

  return {
    tier,
    source,
    limits,
    lifetimeUsed: Boolean(user?.free_private_gallery_created),
  }
}

/**
 * All 4 tiers' live (admin-editable) quota numbers, for display next to each
 * plan's price on the packages panel — sourced straight from the same
 * private_gallery_tiers table /manage edits, not hardcoded copy.
 */
export async function getAllPrivateGalleryTierLimits(): Promise<PrivateGalleryTierRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('private_gallery_tiers')
    .select('tier, max_galleries, max_photos_per_gallery, is_lifetime_cap')
    .order('display_order', { ascending: true })

  if (error || !data) {
    throw new Error(error?.message ?? 'private_gallery_tiers is empty')
  }

  return data as PrivateGalleryTierRow[]
}
