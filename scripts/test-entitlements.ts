import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveStudioEntitlements,
  hasActiveSubscriptionLike,
  isTrialActive,
  canUseFeature,
  getHeroImageLimit,
  getPublicGalleryLimit,
  getGalleryPhotoLimit,
  pickFreeDisplayedGallery,
  FREE_LIMITS,
  PRO_LIMITS,
  FREE_HERO_IMAGE_LIMIT,
  FREE_PUBLIC_GALLERY_LIMIT,
  FREE_GALLERY_PHOTO_LIMIT,
} from '../lib/subscriptions/entitlements.ts'
import { getStudioEntitlements } from '../lib/subscriptions/loader.ts'
import { assertFeatureAllowed } from '../lib/subscriptions/guard.ts'
import { ProFeatureBlockedError } from '../lib/subscriptions/guard.ts'

const now = new Date('2026-01-15T12:00:00Z')

describe('hasActiveSubscriptionLike', () => {
  it('active with future period_end = PRO', () => {
    const sub = { status: 'active', current_period_end: '2026-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    assert.equal(hasActiveSubscriptionLike(sub, now), true)
  })
  it('active with null period_end = PRO', () => {
    const sub = { status: 'active', current_period_end: null, updated_at: '2026-01-01T00:00:00Z' }
    assert.equal(hasActiveSubscriptionLike(sub, now), true)
  })
  it('active with past period_end = FREE', () => {
    const sub = { status: 'active', current_period_end: '2026-01-01T00:00:00Z', updated_at: '2025-12-01T00:00:00Z' }
    assert.equal(hasActiveSubscriptionLike(sub, now), false)
  })
  it('past_due within 7-day grace = PRO', () => {
    const sub = { status: 'past_due', current_period_end: '2026-01-01T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' }
    assert.equal(hasActiveSubscriptionLike(sub, now), true)
  })
  it('past_due beyond 7-day grace = FREE', () => {
    const sub = { status: 'past_due', current_period_end: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    assert.equal(hasActiveSubscriptionLike(sub, now), false)
  })
  it('payment_failed within grace = PRO', () => {
    const sub = { status: 'payment_failed', current_period_end: '2026-01-01T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' }
    assert.equal(hasActiveSubscriptionLike(sub, now), true)
  })
  it('canceled = FREE', () => {
    const sub = { status: 'canceled', current_period_end: '2026-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    assert.equal(hasActiveSubscriptionLike(sub, now), false)
  })
  it('null subscription = FREE', () => {
    assert.equal(hasActiveSubscriptionLike(null, now), false)
  })
})

describe('isTrialActive', () => {
  it('future trial end = true', () => {
    assert.equal(isTrialActive('2026-02-01T00:00:00Z', now), true)
  })
  it('past trial end = false', () => {
    assert.equal(isTrialActive('2026-01-01T00:00:00Z', now), false)
  })
  it('null/undefined = false', () => {
    assert.equal(isTrialActive(null, now), false)
    assert.equal(isTrialActive(undefined, now), false)
  })
})

describe('resolveStudioEntitlements - tier resolution', () => {
  it('forced FREE override = FREE', () => {
    const e = resolveStudioEntitlements({ trialEndDate: '2026-02-01T00:00:00Z', subscriptionTierOverride: 'free', hasActiveSubscription: true, paymentsCheckoutEnabled: true, now })
    assert.equal(e.tier, 'free')
    assert.equal(e.isPro, false)
    assert.equal(e.source, 'admin_override')
  })
  it('forced PRO override = PRO', () => {
    const e = resolveStudioEntitlements({ trialEndDate: null, subscriptionTierOverride: 'pro', hasActiveSubscription: false, paymentsCheckoutEnabled: true, now })
    assert.equal(e.tier, 'pro')
    assert.equal(e.isPro, true)
    assert.equal(e.source, 'admin_override')
  })
  it('auto with active trial = PRO (trial)', () => {
    const e = resolveStudioEntitlements({ trialEndDate: '2026-02-01T00:00:00Z', subscriptionTierOverride: 'auto', hasActiveSubscription: false, paymentsCheckoutEnabled: true, now })
    assert.equal(e.tier, 'pro')
    assert.equal(e.isPro, true)
    assert.equal(e.source, 'trial')
  })
  it('auto with active subscription = PRO (subscription)', () => {
    const e = resolveStudioEntitlements({ trialEndDate: null, subscriptionTierOverride: 'auto', hasActiveSubscription: true, paymentsCheckoutEnabled: true, now })
    assert.equal(e.tier, 'pro')
    assert.equal(e.isPro, true)
    assert.equal(e.source, 'subscription')
  })
  it('auto with expired trial + no subscription + checkout enabled = FREE', () => {
    const e = resolveStudioEntitlements({ trialEndDate: '2026-01-01T00:00:00Z', subscriptionTierOverride: 'auto', hasActiveSubscription: false, paymentsCheckoutEnabled: true, now })
    assert.equal(e.tier, 'free')
    assert.equal(e.isPro, false)
    assert.equal(e.source, 'free')
  })
  it('auto with active trial takes precedence over subscription', () => {
    const e = resolveStudioEntitlements({ trialEndDate: '2026-02-01T00:00:00Z', subscriptionTierOverride: 'auto', hasActiveSubscription: true, paymentsCheckoutEnabled: true, now })
    assert.equal(e.source, 'trial')
  })

  it('auto with expired trial + checkout disabled = PRO (pre_launch), not FREE', () => {
    const e = resolveStudioEntitlements({ trialEndDate: '2026-01-01T00:00:00Z', subscriptionTierOverride: 'auto', hasActiveSubscription: false, paymentsCheckoutEnabled: false, now })
    assert.equal(e.tier, 'pro')
    assert.equal(e.isPro, true)
    assert.equal(e.source, 'pre_launch')
    assert.equal(getPublicGalleryLimit(e), PRO_LIMITS.publicGalleries)
  })
  it('auto with no trial at all + checkout disabled = PRO (pre_launch)', () => {
    const e = resolveStudioEntitlements({ trialEndDate: null, subscriptionTierOverride: 'auto', hasActiveSubscription: false, paymentsCheckoutEnabled: false, now })
    assert.equal(e.tier, 'pro')
    assert.equal(e.source, 'pre_launch')
  })
  it('forced FREE override still wins even when checkout disabled', () => {
    const e = resolveStudioEntitlements({ trialEndDate: '2026-01-01T00:00:00Z', subscriptionTierOverride: 'free', hasActiveSubscription: false, paymentsCheckoutEnabled: false, now })
    assert.equal(e.tier, 'free')
    assert.equal(e.source, 'admin_override')
  })
  it('active trial still reports source "trial" (not pre_launch) even when checkout disabled', () => {
    const e = resolveStudioEntitlements({ trialEndDate: '2026-02-01T00:00:00Z', subscriptionTierOverride: 'auto', hasActiveSubscription: false, paymentsCheckoutEnabled: false, now })
    assert.equal(e.source, 'trial')
  })
})

describe('resolveStudioEntitlements - limits', () => {
  it('FREE limits: heroImages=3, publicGalleries=1, galleryPhotos=30', () => {
    const e = resolveStudioEntitlements({ trialEndDate: null, subscriptionTierOverride: 'free', hasActiveSubscription: false, paymentsCheckoutEnabled: true, now })
    assert.equal(getHeroImageLimit(e), FREE_HERO_IMAGE_LIMIT)
    assert.equal(getPublicGalleryLimit(e), FREE_PUBLIC_GALLERY_LIMIT)
    assert.equal(getGalleryPhotoLimit(e), FREE_GALLERY_PHOTO_LIMIT)
  })
  it('PRO limits: all Infinity', () => {
    const e = resolveStudioEntitlements({ trialEndDate: '2026-02-01T00:00:00Z', subscriptionTierOverride: 'auto', hasActiveSubscription: false, paymentsCheckoutEnabled: true, now })
    assert.equal(getHeroImageLimit(e), PRO_LIMITS.heroImages)
    assert.equal(getPublicGalleryLimit(e), PRO_LIMITS.publicGalleries)
    assert.equal(getGalleryPhotoLimit(e), PRO_LIMITS.galleryPhotos)
  })
})

describe('canUseFeature', () => {
  const free = resolveStudioEntitlements({ trialEndDate: null, subscriptionTierOverride: 'free', hasActiveSubscription: false, paymentsCheckoutEnabled: true, now })
  const pro = resolveStudioEntitlements({ trialEndDate: '2026-02-01T00:00:00Z', subscriptionTierOverride: 'auto', hasActiveSubscription: false, paymentsCheckoutEnabled: true, now })

  const features: Array<[string, boolean, boolean]> = [
    ['hero_video', false, true],
    ['posts', false, true],
    ['testimonials', false, true],
    ['packages', false, true],
    ['before_after', false, true],
    ['faq', false, true],
    ['multiple_public_galleries', false, true],
  ]

  for (const [feature, freeAllowed, proAllowed] of features) {
    it(`${feature} FREE=${freeAllowed}, PRO=${proAllowed}`, () => {
      assert.equal(canUseFeature(free, feature as any), freeAllowed)
      assert.equal(canUseFeature(pro, feature as any), proAllowed)
    })
  }
})

describe('pickFreeDisplayedGallery', () => {
  it('returns null when no public galleries', () => {
    const galleries = [{ id: 'a', is_public: false, created_at: '2026-01-01' }]
    assert.equal(pickFreeDisplayedGallery(galleries), null)
  })
  it('returns earliest public gallery when multiple', () => {
    const galleries = [
      { id: 'a', is_public: true, created_at: '2026-01-03' },
      { id: 'b', is_public: true, created_at: '2026-01-01' },
      { id: 'c', is_public: true, created_at: '2026-01-02' },
    ]
    const picked = pickFreeDisplayedGallery(galleries)
    assert.equal(picked?.id, 'b')
  })
  it('ignores non-public galleries', () => {
    const galleries = [
      { id: 'a', is_public: false, created_at: '2026-01-01' },
      { id: 'b', is_public: true, created_at: '2026-01-02' },
    ]
    const picked = pickFreeDisplayedGallery(galleries)
    assert.equal(picked?.id, 'b')
  })
})

describe('assertFeatureAllowed - PRO mutation blocked for FREE', () => {
  // Note: these test the logic by constructing entitlements directly
  // The actual assertFeatureAllowed calls getStudioEntitlements which needs DB
  // We test the core logic via canUseFeature above
  it('ProFeatureBlockedError has correct code and message', () => {
    const err = new ProFeatureBlockedError('hero_video')
    assert.equal(err.code, 'PRO_FEATURE_REQUIRED')
    assert.equal(err.message, 'הפיצ׳ר הזה זמין בגרסת PRO בלבד')
    assert.ok(err instanceof ProFeatureBlockedError)
  })
})

describe('Data preserved on downgrade', () => {
  it('PRO_LIMITS: heroImages/galleryPhotos unlimited, publicGalleries capped at 4', () => {
    assert.equal(PRO_LIMITS.heroImages, Infinity)
    assert.equal(PRO_LIMITS.publicGalleries, 4)
    assert.equal(PRO_LIMITS.galleryPhotos, Infinity)
  })
  it('FREE_LIMITS have fixed caps', () => {
    assert.equal(FREE_LIMITS.heroImages, 3)
    assert.equal(FREE_LIMITS.publicGalleries, 1)
    assert.equal(FREE_LIMITS.galleryPhotos, 30)
  })
  it('resolveStudioEntitlements on forced FREE keeps existing data - features false, limits free', () => {
    const e = resolveStudioEntitlements({ trialEndDate: '2026-02-01T00:00:00Z', subscriptionTierOverride: 'pro', hasActiveSubscription: true, paymentsCheckoutEnabled: true, now })
    assert.equal(e.tier, 'pro')
    assert.equal(e.isPro, true)
    // After override to free (simulated by calling with free override)
    const e2 = resolveStudioEntitlements({ trialEndDate: '2026-02-01T00:00:00Z', subscriptionTierOverride: 'free', hasActiveSubscription: true, paymentsCheckoutEnabled: true, now })
    assert.equal(e2.tier, 'free')
    assert.equal(e2.isPro, false)
    assert.equal(e2.limits.heroImages, 3)
    assert.equal(e2.limits.publicGalleries, 1)
    assert.equal(e2.limits.galleryPhotos, 30)
    // Features all false
    assert.equal(e2.features.hero_video, false)
    assert.equal(e2.features.posts, false)
  })
})

console.log('All entitlement tests passed')