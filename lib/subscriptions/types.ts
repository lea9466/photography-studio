/**
 * Free / Pro entitlement domain types.
 *
 * Single source of truth for tier definitions. All feature names live here so
 * they are never scattered as magic strings across the codebase.
 */

export const PRO_FEATURES = [
  'hero_video',
  'posts',
  'testimonials',
  'packages',
  'before_after',
  'faq',
  'multiple_public_galleries',
] as const

export type ProFeature = (typeof PRO_FEATURES)[number]

export type EntitlementTier = 'free' | 'pro'

/**
 * Where the current tier came from. Displayed in the platform admin badges.
 */
export type EntitlementSource =
  | 'trial'
  | 'subscription'
  | 'admin_override'
  | 'free'
  | 'pre_launch'

/**
 * Platform-admin override stored on `users.subscription_tier_override`.
 * `null` and `'auto'` are equivalent — resolved from trial/subscription only.
 */
export type SubscriptionTierOverride = 'auto' | 'pro' | 'free'

export type StudioLimits = {
  /** Hero image slots (FREE = 3). */
  heroImages: number
  /** Publicly displayed galleries (FREE = 1). */
  publicGalleries: number
  /** Publicly displayed photos per gallery (FREE = 30). */
  galleryPhotos: number
}

export type StudioFeatures = Record<ProFeature, boolean>

export type StudioEntitlements = {
  tier: EntitlementTier
  isPro: boolean
  source: EntitlementSource
  limits: StudioLimits
  features: StudioFeatures
}

/** The exact error a FREE user sees when they hit a locked PRO feature. */
export const PRO_ONLY_ERROR_MESSAGE =
  'הפיצ׳ר הזה זמין בגרסת PRO בלבד'

/**
 * Server action error code used by clients to open the upgrade dialog instead
 * of showing a raw error toast.
 */
export const PRO_ONLY_ERROR_CODE = 'PRO_FEATURE_REQUIRED'
