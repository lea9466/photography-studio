import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CLIENT_ALBUM_LOCKED_MESSAGE,
  assertClientAlbumEditable,
  isClientAlbumFrozen,
} from '../lib/private-galleries/gallery-lock'
import {
  daysUntil,
  targetWarningStage,
} from '../lib/private-galleries/client-gallery-lifecycle'
import {
  SUSPENSION_GRACE_DAYS,
  SUSPENDED_DELETE_GRACE_DAYS,
  isPastSuspensionGrace,
  isPastSuspendedDeleteGrace,
  isInSuspendedFinalWarningWindow,
} from '../lib/private-galleries/gallery-suspension'
import { galleryPersistsWhileSubscribed } from '../lib/private-galleries/entitlements'

/**
 * "One-time use": a client (selection) gallery's source album is frozen the
 * moment it is first sent — sendGallery stamps photos_locked_at, and from then
 * on reservePhotosBatch / deletePhoto(s) reject album mutations. Showcase
 * (portfolio) galleries are never frozen; an unsent client gallery stays
 * editable. See docs/private-gallery-lifecycle-plan.md §1.א.
 */

const SENT = '2026-09-06T10:00:00.000Z'

test('frozen only when a client gallery has been sent', () => {
  assert.equal(isClientAlbumFrozen({ gallery_type: 'selection', photos_locked_at: SENT }), true)
  assert.equal(isClientAlbumFrozen({ gallery_type: 'selection', photos_locked_at: null }), false)
})

test('showcase galleries are never frozen, even with a stray timestamp', () => {
  assert.equal(isClientAlbumFrozen({ gallery_type: 'portfolio', photos_locked_at: SENT }), false)
  assert.equal(isClientAlbumFrozen({ gallery_type: 'portfolio', photos_locked_at: null }), false)
})

test('grandfathering: a gallery sent before the feature (null) is editable', () => {
  assert.doesNotThrow(() =>
    assertClientAlbumEditable({ gallery_type: 'selection', photos_locked_at: null })
  )
})

test('assertClientAlbumEditable throws the client-facing message for a sent client gallery', () => {
  assert.throws(
    () => assertClientAlbumEditable({ gallery_type: 'selection', photos_locked_at: SENT }),
    (err: unknown) => err instanceof Error && err.message === CLIENT_ALBUM_LOCKED_MESSAGE
  )
})

test('assertClientAlbumEditable is a no-op for showcase and unsent galleries', () => {
  assert.doesNotThrow(() =>
    assertClientAlbumEditable({ gallery_type: 'portfolio', photos_locked_at: SENT })
  )
  assert.doesNotThrow(() =>
    assertClientAlbumEditable({ gallery_type: 'selection', photos_locked_at: null })
  )
})

test('missing / unknown gallery_type is treated as not-a-client-gallery (no lock)', () => {
  assert.equal(isClientAlbumFrozen({ photos_locked_at: SENT }), false)
  assert.equal(isClientAlbumFrozen({ gallery_type: null, photos_locked_at: SENT }), false)
  assert.doesNotThrow(() => assertClientAlbumEditable({ photos_locked_at: SENT }))
})

// --- phase 2: 60-day life, deletion warnings -------------------------------

test('targetWarningStage maps days-to-deletion to the right stage', () => {
  assert.equal(targetWarningStage(0), 3)
  assert.equal(targetWarningStage(1), 3)
  assert.equal(targetWarningStage(2), 2)
  assert.equal(targetWarningStage(3), 2)
  assert.equal(targetWarningStage(4), 1)
  assert.equal(targetWarningStage(14), 1)
  assert.equal(targetWarningStage(15), 0)
  assert.equal(targetWarningStage(60), 0)
})

test('a missed cron run jumps straight to the current stage (no back-fill)', () => {
  // gallery was at stage 0, cron skipped days — now 2 days out → stage 2,
  // stage 1 (the 14-day email) is simply skipped.
  const current = 0
  const target = targetWarningStage(2)
  assert.equal(target, 2)
  assert.ok(target > current)
})

test('daysUntil rounds up — anything still in the future is at least 1', () => {
  const now = Date.parse('2026-09-06T12:00:00.000Z')
  assert.equal(daysUntil('2026-09-06T18:00:00.000Z', now), 1)
  assert.equal(daysUntil('2026-09-07T12:00:00.000Z', now), 1)
  assert.equal(daysUntil('2026-09-08T11:00:00.000Z', now), 2)
  assert.equal(daysUntil('2026-11-05T12:00:00.000Z', now), 60)
})

// --- phase 4: lapsed-subscription suspension ------------------------------

test('isPastSuspensionGrace: only true once 15 days past the lapse', () => {
  const now = Date.parse('2026-09-30T12:00:00.000Z')
  assert.equal(SUSPENSION_GRACE_DAYS, 15)
  // lapsed 5 days ago → still in grace
  assert.equal(isPastSuspensionGrace('2026-09-25T12:00:00.000Z', now), false)
  // lapsed exactly 15 days ago → grace over
  assert.equal(isPastSuspensionGrace('2026-09-15T12:00:00.000Z', now), true)
  // lapsed 40 days ago → long past
  assert.equal(isPastSuspensionGrace('2026-08-21T12:00:00.000Z', now), true)
  // no lapse date → never suspend on this basis
  assert.equal(isPastSuspensionGrace(null, now), false)
})

// --- galleries persist while a subscription is active ----------------------

test('galleryPersistsWhileSubscribed: only a real subscription or a paid admin override', () => {
  assert.equal(galleryPersistsWhileSubscribed({ source: 'subscription', tier: 'starter' }), true)
  assert.equal(galleryPersistsWhileSubscribed({ source: 'admin_override', tier: 'unlimited' }), true)
  // an admin override can also force someone onto the free tier — that still
  // gets the fixed-length life, not indefinite persistence.
  assert.equal(galleryPersistsWhileSubscribed({ source: 'admin_override', tier: 'free' }), false)
  assert.equal(galleryPersistsWhileSubscribed({ source: 'free', tier: 'free' }), false)
})

// --- suspended-gallery final warning + permanent deletion (30 days total) --

test('isPastSuspendedDeleteGrace: only true 15 days past suspended_at (30 days total incl. SUSPENSION_GRACE_DAYS)', () => {
  const now = Date.parse('2026-10-15T12:00:00.000Z')
  assert.equal(SUSPENDED_DELETE_GRACE_DAYS, 15)
  // suspended 10 days ago → not yet
  assert.equal(isPastSuspendedDeleteGrace('2026-10-05T12:00:00.000Z', now), false)
  // suspended exactly 15 days ago → grace over, delete
  assert.equal(isPastSuspendedDeleteGrace('2026-09-30T12:00:00.000Z', now), true)
  // never suspended → never delete on this basis
  assert.equal(isPastSuspendedDeleteGrace(null, now), false)
})

test('isInSuspendedFinalWarningWindow: fires only in the ~3 days right before deletion, once', () => {
  const now = Date.parse('2026-10-15T12:00:00.000Z')
  // suspended 11 days ago (4 days left) → not yet in the warning window
  assert.equal(isInSuspendedFinalWarningWindow('2026-10-04T12:00:00.000Z', now), false)
  // suspended 13 days ago (2 days left) → inside the window
  assert.equal(isInSuspendedFinalWarningWindow('2026-10-02T12:00:00.000Z', now), true)
  // suspended exactly 15 days ago → already at the delete threshold, window closed
  assert.equal(isInSuspendedFinalWarningWindow('2026-09-30T12:00:00.000Z', now), false)
  assert.equal(isInSuspendedFinalWarningWindow(null, now), false)
})
