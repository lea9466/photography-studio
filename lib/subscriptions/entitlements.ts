import {
  PRO_FEATURES,
  type EntitlementSource,
  type ProFeature,
  type StudioEntitlements,
  type StudioFeatures,
  type StudioLimits,
  type SubscriptionTierOverride,
} from './types'

export const FREE_HERO_IMAGE_LIMIT = 3
export const FREE_PUBLIC_GALLERY_LIMIT = 1
export const FREE_GALLERY_PHOTO_LIMIT = 30

/** Matches the base MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER (lib/types/app.types.ts).
 *  Some accounts get a higher per-email override there; this resolver is pure
 *  and has no DB access, so it reflects the base PRO allowance only. */
export const PRO_PUBLIC_GALLERY_LIMIT = 4
export const PRO_PUBLIC_PHOTO_LIMIT = 160

export const FREE_LIMITS: StudioLimits = {
  heroImages: FREE_HERO_IMAGE_LIMIT,
  publicGalleries: FREE_PUBLIC_GALLERY_LIMIT,
  galleryPhotos: FREE_GALLERY_PHOTO_LIMIT,
}

/** PRO: unlimited galleries/uploads at creation time, but up to
 *  PRO_PUBLIC_GALLERY_LIMIT galleries and PRO_PUBLIC_PHOTO_LIMIT photos total
 *  may be shown on the public site (enforced via app.types.ts constants,
 *  which also apply the per-account email override). */
export const PRO_LIMITS: StudioLimits = {
  heroImages: Infinity,
  publicGalleries: PRO_PUBLIC_GALLERY_LIMIT,
  galleryPhotos: Infinity,
}

function buildFeatures(
  isPro: boolean,
  source: EntitlementSource,
  hasCustomDomainAddon: boolean
): StudioFeatures {
  const features = {} as StudioFeatures
  for (const feature of PRO_FEATURES) {
    features[feature] = isPro
  }
  // custom_domain is deliberately NOT a trial/pre-launch freebie like every
  // other PRO feature — it's meant as a real incentive to actually pay,
  // decided against the earlier "everyone in trial already gets it for
  // free while a lapsed-trial user has to pay for the same thing" bug.
  // pre_launch was only ever meant to hold the fort until payments existed
  // at all, not to permanently include this one on top — so neither counts;
  // only a real subscription or an explicit admin override do.
  //
  // Independently of all that, `hasCustomDomainAddon` is a standalone
  // one-time ₪99 purchase (lib/actions/custom-domain-addon.actions.ts) that
  // unlocks JUST this feature regardless of subscription tier — a studio
  // that's FREE, mid-trial, or even force-downgraded by an admin still keeps
  // it, since it was paid for separately and isn't part of the Pro bundle.
  // Actually serving the connected domain still requires it to stay CURRENT
  // (see the `suspended_billing` status in lib/domains/*) — this addon is
  // exactly what keeps a domain out of that state without a live subscription.
  features.custom_domain = Boolean(
    (isPro && (source === 'subscription' || source === 'admin_override')) || hasCustomDomainAddon
  )
  return features
}

export type ActiveSubscriptionLike = {
  status: string | null
  current_period_end?: string | null
  updated_at?: string | null
} | null

/** Mirrors `SubscriptionService.hasActiveSubscription` (lib/payments):
 *  active (with period window) or past_due/payment_failed inside a 7-day grace. */
export function hasActiveSubscriptionLike(
  subscription: ActiveSubscriptionLike,
  now = new Date()
): boolean {
  if (!subscription) return false
  const status = subscription.status

  if (status === 'active') {
    const currentPeriodEnd = subscription.current_period_end
    if (currentPeriodEnd == null) return true
    return new Date(currentPeriodEnd).getTime() >= now.getTime()
  }

  if (status === 'past_due' || status === 'payment_failed') {
    const graceUntil = new Date(subscription.updated_at ?? now.toISOString())
    graceUntil.setUTCDate(graceUntil.getUTCDate() + 7)
    return graceUntil.getTime() >= now.getTime()
  }

  return false
}

export function isTrialActive(
  trialEndDate: string | Date | null | undefined,
  now = new Date()
): boolean {
  if (!trialEndDate) return false
  return new Date(trialEndDate).getTime() > now.getTime()
}

export type ResolveStudioEntitlementsInput = {
  trialEndDate: string | Date | null
  subscriptionTierOverride: SubscriptionTierOverride | null | undefined
  hasActiveSubscription: boolean
  /** From `isPaymentsCheckoutEnabled()` (lib/payments/flags.ts). No caller may
   *  default this — omitting it would silently mask the pre-launch grace
   *  below, so passing the real flag is mandatory. */
  paymentsCheckoutEnabled: boolean
  /** `users.custom_domain_addon_purchased_at IS NOT NULL` — a standalone
   *  one-time purchase, independent of subscription tier. See buildFeatures. */
  hasCustomDomainAddon: boolean
  now?: Date
}

/**
 * The single entitlement resolver. Deterministic and pure — never touches the
 * database. Both PRO conditions and the admin override are collapsed here:
 *
 *   forced PRO   → PRO (admin_override)
 *   forced FREE  → FREE (admin_override)  — even with an active trial/subscription
 *   auto         → PRO while trial is active OR a subscription is active,
 *                  otherwise FREE — UNLESS checkout isn't live yet, in which
 *                  case auto users stay PRO (pre_launch) since there is no
 *                  way for them to pay to keep it.
 */
export function resolveStudioEntitlements(
  input: ResolveStudioEntitlementsInput
): StudioEntitlements {
  const now = input.now ?? new Date()
  const override = input.subscriptionTierOverride ?? 'auto'

  if (override === 'free') {
    return {
      tier: 'free',
      isPro: false,
      source: 'admin_override',
      limits: FREE_LIMITS,
      features: buildFeatures(false, 'admin_override', input.hasCustomDomainAddon),
    }
  }

  const trialActive = isTrialActive(input.trialEndDate, now)
  const preLaunchGrace = override === 'auto' && !input.paymentsCheckoutEnabled
  const isPro =
    override === 'pro' ||
    trialActive ||
    input.hasActiveSubscription ||
    preLaunchGrace

  if (!isPro) {
    return {
      tier: 'free',
      isPro: false,
      source: 'free',
      limits: FREE_LIMITS,
      features: buildFeatures(false, 'free', input.hasCustomDomainAddon),
    }
  }

  const source: EntitlementSource =
    override === 'pro'
      ? 'admin_override'
      : trialActive
        ? 'trial'
        : input.hasActiveSubscription
          ? 'subscription'
          : 'pre_launch'

  return {
    tier: 'pro',
    isPro: true,
    source,
    limits: PRO_LIMITS,
    features: buildFeatures(true, source, input.hasCustomDomainAddon),
  }
}

export function canUseFeature(
  entitlements: StudioEntitlements,
  feature: ProFeature
): boolean {
  return entitlements.features[feature]
}

/** Platform-admin badge: PRO / FREE / TRIAL / PRE-LAUNCH / FORCED PRO / FORCED FREE. */
export function resolveTierBadge(entitlements: StudioEntitlements):
  | 'PRO'
  | 'FREE'
  | 'TRIAL'
  | 'PRE-LAUNCH'
  | 'FORCED PRO'
  | 'FORCED FREE' {
  if (entitlements.source === 'admin_override') {
    return entitlements.isPro ? 'FORCED PRO' : 'FORCED FREE'
  }
  if (!entitlements.isPro) return 'FREE'
  if (entitlements.source === 'trial') return 'TRIAL'
  if (entitlements.source === 'pre_launch') return 'PRE-LAUNCH'
  return 'PRO'
}

export function getHeroImageLimit(entitlements: StudioEntitlements): number {
  return entitlements.limits.heroImages
}

export function getPublicGalleryLimit(entitlements: StudioEntitlements): number {
  return entitlements.limits.publicGalleries
}

export function getGalleryPhotoLimit(entitlements: StudioEntitlements): number {
  return entitlements.limits.galleryPhotos
}

/**
 * Deterministic fallback used ONLY for pre-existing accounts that already have
 * more than one `is_public` gallery after a PRO→FREE downgrade (we never mutate
 * their data). New FREE display changes are blocked at toggle time, so this
 * only ever kicks in for legacy data.
 */
export function pickFreeDisplayedGallery<
  T extends { id: string; is_public: boolean; created_at: string },
>(galleries: T[]): T | null {
  const publicGalleries = galleries.filter((gallery) => gallery.is_public)
  if (publicGalleries.length === 0) return null
  return publicGalleries.reduce((earliest, gallery) =>
    gallery.created_at < earliest.created_at ? gallery : earliest
  )
}
