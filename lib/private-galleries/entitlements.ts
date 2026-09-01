import { hasActiveSubscriptionLike, type ActiveSubscriptionLike } from '@/lib/subscriptions/entitlements'
import {
  PRIVATE_GALLERY_PLAN_CODE_TO_TIER,
  type PrivateGalleryEntitlementSource,
  type PrivateGalleryLimits,
  type PrivateGalleryTier,
  type PrivateGalleryTierOverride,
} from './types'

export type PrivateGalleryTierRow = {
  tier: PrivateGalleryTier
  max_galleries: number
  max_photos_per_gallery: number
  is_lifetime_cap: boolean
}

/**
 * Pure resolver: decides WHICH tier applies. Priority: explicit admin
 * override > an active `private_galleries`-product subscription (mapped via
 * its plan code) > free. Never touches the DB — the loader supplies the rows.
 */
export function resolvePrivateGalleryTier(input: {
  tierOverride: PrivateGalleryTierOverride | null | undefined
  subscription: ActiveSubscriptionLike
  planCode: string | null
  now?: Date
}): { tier: PrivateGalleryTier; source: PrivateGalleryEntitlementSource } {
  const override = input.tierOverride ?? 'auto'
  if (override !== 'auto') {
    return { tier: override, source: 'admin_override' }
  }

  if (hasActiveSubscriptionLike(input.subscription, input.now)) {
    const tier = input.planCode ? PRIVATE_GALLERY_PLAN_CODE_TO_TIER[input.planCode] : undefined
    if (tier) return { tier, source: 'subscription' }
  }

  return { tier: 'free', source: 'free' }
}

/** Pure lookup — pulls the live (admin-editable) quota numbers for one tier out of the rows the loader fetched. */
export function pickLimitsForTier(
  tier: PrivateGalleryTier,
  tierRows: PrivateGalleryTierRow[]
): PrivateGalleryLimits {
  const row = tierRows.find((r) => r.tier === tier)
  if (!row) {
    throw new Error(`private_gallery_tiers is missing a row for tier "${tier}"`)
  }
  return {
    maxGalleries: row.max_galleries,
    maxPhotosPerGallery: row.max_photos_per_gallery,
    isLifetimeCap: row.is_lifetime_cap,
  }
}

/** Hebrew error text, mirroring buildPublicGalleryCountLimitError (lib/types/app.types.ts). */
export function buildPrivateGalleryCountLimitError(
  currentCount: number,
  maxGalleries: number,
  isLifetime: boolean
): string | null {
  if (currentCount < maxGalleries) return null
  if (isLifetime) {
    return 'ניצלת כבר את הגלריה הפרטית החינמית שלך — מחיקתה לא תשחרר מקום. יש לשדרג למסלול בתשלום כדי ליצור גלריה נוספת.'
  }
  return `ניתן ליצור עד ${maxGalleries} גלריות פרטיות במקביל במסלול הנוכחי. מחקי גלריה קיימת או שדרגי כדי ליצור חדשה.`
}
