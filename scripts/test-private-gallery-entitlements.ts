import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolvePrivateGalleryTier,
  pickLimitsForTier,
  buildPrivateGalleryCountLimitError,
  type PrivateGalleryTierRow,
} from '../lib/private-galleries/entitlements.ts'

const now = new Date('2026-01-15T12:00:00Z')

const tierRows: PrivateGalleryTierRow[] = [
  { tier: 'free', max_galleries: 1, max_photos_per_gallery: 400, is_lifetime_cap: true },
  { tier: 'starter', max_galleries: 8, max_photos_per_gallery: 400, is_lifetime_cap: false },
  { tier: 'pro', max_galleries: 16, max_photos_per_gallery: 850, is_lifetime_cap: false },
  { tier: 'unlimited', max_galleries: 35, max_photos_per_gallery: 1500, is_lifetime_cap: false },
]

describe('resolvePrivateGalleryTier', () => {
  it('no override, no subscription = free', () => {
    const r = resolvePrivateGalleryTier({ tierOverride: 'auto', subscription: null, planCode: null, now })
    assert.equal(r.tier, 'free')
    assert.equal(r.source, 'free')
  })
  it('no override, no subscription row but stale planCode = free (ignored, since subscription itself is null)', () => {
    const r = resolvePrivateGalleryTier({
      tierOverride: 'auto',
      subscription: null,
      planCode: 'private_gallery_pro',
      now,
    })
    assert.equal(r.tier, 'free')
  })
  it('active subscription mapped via plan code = matching tier', () => {
    const active = { status: 'active', current_period_end: '2026-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    const r = resolvePrivateGalleryTier({
      tierOverride: 'auto',
      subscription: active,
      planCode: 'private_gallery_starter',
      now,
    })
    assert.equal(r.tier, 'starter')
    assert.equal(r.source, 'subscription')
  })
  it('active subscription within past_due grace still resolves the tier', () => {
    const pastDue = { status: 'past_due', current_period_end: '2026-01-01T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' }
    const r = resolvePrivateGalleryTier({
      tierOverride: 'auto',
      subscription: pastDue,
      planCode: 'private_gallery_unlimited',
      now,
    })
    assert.equal(r.tier, 'unlimited')
  })
  it('expired subscription falls back to free even with a plan code', () => {
    const expired = { status: 'active', current_period_end: '2025-01-01T00:00:00Z', updated_at: '2024-12-01T00:00:00Z' }
    const r = resolvePrivateGalleryTier({
      tierOverride: 'auto',
      subscription: expired,
      planCode: 'private_gallery_pro',
      now,
    })
    assert.equal(r.tier, 'free')
    assert.equal(r.source, 'free')
  })
  it('unknown plan code on an active subscription falls back to free', () => {
    const active = { status: 'active', current_period_end: '2026-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    const r = resolvePrivateGalleryTier({
      tierOverride: 'auto',
      subscription: active,
      planCode: 'studio_monthly',
      now,
    })
    assert.equal(r.tier, 'free')
  })
  it('explicit admin override wins over an active subscription', () => {
    const active = { status: 'active', current_period_end: '2026-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    const r = resolvePrivateGalleryTier({
      tierOverride: 'unlimited',
      subscription: active,
      planCode: 'private_gallery_starter',
      now,
    })
    assert.equal(r.tier, 'unlimited')
    assert.equal(r.source, 'admin_override')
  })
  it('explicit admin override to free wins even with an active paid subscription', () => {
    const active = { status: 'active', current_period_end: '2026-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    const r = resolvePrivateGalleryTier({
      tierOverride: 'free',
      subscription: active,
      planCode: 'private_gallery_pro',
      now,
    })
    assert.equal(r.tier, 'free')
    assert.equal(r.source, 'admin_override')
  })
})

describe('pickLimitsForTier', () => {
  it('free tier is a lifetime cap of 1 gallery / 400 photos', () => {
    const limits = pickLimitsForTier('free', tierRows)
    assert.deepEqual(limits, { maxGalleries: 1, maxPhotosPerGallery: 400, isLifetimeCap: true })
  })
  it('starter/pro/unlimited are concurrent caps', () => {
    assert.equal(pickLimitsForTier('starter', tierRows).isLifetimeCap, false)
    assert.equal(pickLimitsForTier('pro', tierRows).maxGalleries, 16)
    assert.equal(pickLimitsForTier('unlimited', tierRows).maxPhotosPerGallery, 1500)
  })
  it('throws if the tier row is missing (misconfigured DB)', () => {
    assert.throws(() => pickLimitsForTier('starter', []))
  })
})

describe('buildPrivateGalleryCountLimitError', () => {
  it('under the limit = no error', () => {
    assert.equal(buildPrivateGalleryCountLimitError(0, 8, false), null)
    assert.equal(buildPrivateGalleryCountLimitError(7, 8, false), null)
  })
  it('at the concurrent limit = blocked, mentions deleting an existing gallery', () => {
    const message = buildPrivateGalleryCountLimitError(8, 8, false)
    assert.ok(message)
    assert.match(message!, /8/)
    assert.match(message!, /מחקי/)
  })
  it('at the lifetime limit = blocked, explicitly says deleting does not help', () => {
    const message = buildPrivateGalleryCountLimitError(1, 1, true)
    assert.ok(message)
    assert.match(message!, /לא תשחרר מקום/)
  })
  it('lifetime not yet used = no error', () => {
    assert.equal(buildPrivateGalleryCountLimitError(0, 1, true), null)
  })
})

console.log('All private-gallery entitlement tests passed')
