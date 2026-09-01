/**
 * Private (client) gallery subscription domain types.
 *
 * A fully independent product from the public-site Free/Pro entitlement
 * (lib/subscriptions/types.ts) — a studio's private-gallery tier has no
 * bearing on her public-site tier, or vice versa.
 */

export type PrivateGalleryTier = 'free' | 'starter' | 'pro' | 'unlimited'

export const PRIVATE_GALLERY_TIERS: readonly PrivateGalleryTier[] = [
  'free',
  'starter',
  'pro',
  'unlimited',
]

/** The plan_id → tier mapping lives in the DB (subscription_plans.code); this maps codes to tiers. */
export const PRIVATE_GALLERY_PLAN_CODE_TO_TIER: Record<string, PrivateGalleryTier> = {
  private_gallery_starter: 'starter',
  private_gallery_pro: 'pro',
  private_gallery_unlimited: 'unlimited',
}

/**
 * Quota numbers for one tier, sourced live from the `private_gallery_tiers`
 * table (editable from /manage) — never hardcoded, so a price/quota change
 * takes effect immediately without a deploy.
 */
export type PrivateGalleryLimits = {
  maxGalleries: number
  maxPhotosPerGallery: number
  /** True only for the free tier: maxGalleries counts lifetime creations, not concurrently-existing ones. */
  isLifetimeCap: boolean
}

export type PrivateGalleryEntitlementSource = 'admin_override' | 'subscription' | 'free'

export type PrivateGalleryEntitlements = {
  tier: PrivateGalleryTier
  source: PrivateGalleryEntitlementSource
  limits: PrivateGalleryLimits
  /** Only meaningful when limits.isLifetimeCap is true — users.free_private_gallery_created. */
  lifetimeUsed: boolean
}

/** Platform-admin override stored on `users.private_gallery_tier_override`. */
export type PrivateGalleryTierOverride = 'auto' | PrivateGalleryTier
