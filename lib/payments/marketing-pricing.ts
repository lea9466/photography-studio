import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseBillingRepository } from '@/lib/payments/repository'
import { getAllPrivateGalleryTierLimits } from '@/lib/private-galleries/loader'
import { PRIVATE_GALLERY_TIER_LABELS, type PrivateGalleryTier } from '@/lib/private-galleries/types'

export type MarketingProPricing = {
  monthlyPrice: string
  monthlyCompareAt: string | null
  monthlyBadge: string | null
  yearlyPrice: string
  yearlyCompareAt: string | null
  yearlyBadge: string | null
}

const FALLBACK_PRICING: MarketingProPricing = {
  monthlyPrice: '5',
  monthlyCompareAt: '40',
  monthlyBadge: 'מחיר השקה',
  yearlyPrice: '349',
  yearlyCompareAt: '400',
  yearlyBadge: 'הכי משתלם',
}

// Formats agorot (DB's integer unit) to a display shekel string. Not
// exported: this file is 'server-only', and every price it hands out below
// is already a formatted string for exactly that reason — a client pricing
// component importing this function itself would pull a server-only module
// into the client bundle and fail to build.
function formatShekels(agorot: number) {
  const amount = agorot / 100
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}

export async function getMarketingProPricing(): Promise<MarketingProPricing> {
  try {
    const repository = new SupabaseBillingRepository(createAdminClient())
    const plans = await repository.listActivePlans()
    const monthly = plans.find((p) => p.code === 'studio_monthly')
    const yearly = plans.find((p) => p.code === 'studio_yearly')

    if (!monthly || !yearly) return FALLBACK_PRICING

    return {
      monthlyPrice: formatShekels(monthly.amount_agorot),
      monthlyCompareAt:
        monthly.compare_at_amount_agorot != null ? formatShekels(monthly.compare_at_amount_agorot) : null,
      monthlyBadge: monthly.badge,
      yearlyPrice: formatShekels(yearly.amount_agorot),
      yearlyCompareAt:
        yearly.compare_at_amount_agorot != null ? formatShekels(yearly.compare_at_amount_agorot) : null,
      yearlyBadge: yearly.badge,
    }
  } catch {
    return FALLBACK_PRICING
  }
}

const PAID_GALLERY_TIERS = ['starter', 'pro', 'unlimited'] as const satisfies readonly Exclude<
  PrivateGalleryTier,
  'free'
>[]

export type MarketingGalleryFreeTier = {
  maxGalleries: number
  maxPhotosPerGallery: number
  isLifetimeCap: boolean
}

export type MarketingGalleryPaidTier = {
  tier: (typeof PAID_GALLERY_TIERS)[number]
  name: string
  price: string
  compareAt: string | null
  badge: string | null
  isHighlighted: boolean
  maxGalleries: number
  maxPhotosPerGallery: number
}

export type MarketingGalleryPricing = {
  free: MarketingGalleryFreeTier
  paid: MarketingGalleryPaidTier[]
}

// Mirrors the live rows as of this section's build (see private_gallery_tiers
// and subscription_plans) — only used if either table can't be read.
const FALLBACK_GALLERY_PRICING: MarketingGalleryPricing = {
  free: { maxGalleries: 1, maxPhotosPerGallery: 400, isLifetimeCap: true },
  paid: [
    {
      tier: 'starter',
      name: PRIVATE_GALLERY_TIER_LABELS.starter,
      price: '29',
      compareAt: null,
      badge: null,
      isHighlighted: false,
      maxGalleries: 8,
      maxPhotosPerGallery: 400,
    },
    {
      tier: 'pro',
      name: PRIVATE_GALLERY_TIER_LABELS.pro,
      price: '59',
      compareAt: null,
      badge: null,
      isHighlighted: false,
      maxGalleries: 16,
      maxPhotosPerGallery: 850,
    },
    {
      tier: 'unlimited',
      name: PRIVATE_GALLERY_TIER_LABELS.unlimited,
      price: '99',
      compareAt: null,
      badge: null,
      isHighlighted: false,
      maxGalleries: 35,
      maxPhotosPerGallery: 1500,
    },
  ],
}

/**
 * Private-galleries packages for the marketing homepage — prices from
 * subscription_plans (product='private_galleries'), quotas from
 * private_gallery_tiers (the same table /manage and the dashboard's own
 * entitlement loader read — see getAllPrivateGalleryTierLimits), so a price
 * or quota change in either table shows up here with no deploy. Nothing
 * about this is hardcoded except the fallback used if a table can't be read.
 */
export async function getMarketingPrivateGalleryPricing(): Promise<MarketingGalleryPricing> {
  try {
    const repository = new SupabaseBillingRepository(createAdminClient())
    const [plans, tierRows] = await Promise.all([
      repository.listActivePlans('private_galleries'),
      getAllPrivateGalleryTierLimits(),
    ])

    const freeRow = tierRows.find((r) => r.tier === 'free')
    if (!freeRow) return FALLBACK_GALLERY_PRICING

    const paid = PAID_GALLERY_TIERS.map((tier): MarketingGalleryPaidTier | null => {
      const plan = plans.find((p) => p.code === `private_gallery_${tier}`)
      const limits = tierRows.find((r) => r.tier === tier)
      if (!plan || !limits) return null
      return {
        tier,
        name: PRIVATE_GALLERY_TIER_LABELS[tier],
        price: formatShekels(plan.amount_agorot),
        compareAt: plan.compare_at_amount_agorot != null ? formatShekels(plan.compare_at_amount_agorot) : null,
        badge: plan.badge || null,
        isHighlighted: plan.is_highlighted,
        maxGalleries: limits.max_galleries,
        maxPhotosPerGallery: limits.max_photos_per_gallery,
      }
    }).filter((tier): tier is MarketingGalleryPaidTier => tier !== null)

    if (paid.length === 0) return FALLBACK_GALLERY_PRICING

    return {
      free: {
        maxGalleries: freeRow.max_galleries,
        maxPhotosPerGallery: freeRow.max_photos_per_gallery,
        isLifetimeCap: freeRow.is_lifetime_cap,
      },
      paid,
    }
  } catch {
    return FALLBACK_GALLERY_PRICING
  }
}
