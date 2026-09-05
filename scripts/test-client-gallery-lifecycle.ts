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
