import assert from 'node:assert/strict'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { test } from 'node:test'
import { buildGallerySessionToken } from '../lib/gallery-session-edge'

/**
 * The middleware (Edge runtime) mints `sg_gallery_<id>` for the owning
 * photographer using `buildGallerySessionToken` (Web Crypto). It MUST be
 * byte-identical to:
 *   - `lib/gallery-session.ts`'s Node `buildToken` (the client's minting path)
 *   - `workers/gallery-media-guard/worker.js`'s `verifyGallerySessionToken`
 * or the photographer's cookie won't be accepted by the Worker / won't match
 * the client's cookie for the same gallery.
 *
 * These reimplement the Node build + the Worker verify inline (same approach as
 * `scripts/test-r2-edge-signing.mjs`) and pin the three to agreement.
 */

const SECRET = 'test-gallery-session-secret'
const GID = 'a1b2c3d4-0000-4000-8000-000000000001'

// --- reference: lib/gallery-session.ts buildToken (Node) ---
function nodeSign(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}
function nodeBuildToken(galleryId: string, expMs: number, secret: string): string {
  const payload = `${galleryId}:${expMs}`
  return `${payload}:${nodeSign(secret, payload)}`
}

// --- reference: worker.js verifyGallerySessionToken ---
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
function workerVerify(raw: string | null, galleryId: string, secret: string, nowMs: number): boolean {
  if (!raw) return false
  const lastColon = raw.lastIndexOf(':')
  if (lastColon <= 0) return false
  const sig = raw.slice(lastColon + 1)
  const payload = raw.slice(0, lastColon)
  if (!timingSafeEqualStr(nodeSign(secret, payload), sig)) return false
  const sep = payload.indexOf(':')
  if (sep <= 0) return false
  if (payload.slice(0, sep) !== galleryId) return false
  const exp = Number(payload.slice(sep + 1))
  return Number.isFinite(exp) && nowMs <= exp
}

test('edge token is byte-identical to the Node buildToken', async () => {
  const exp = 1_900_000_000_000
  const edge = await buildGallerySessionToken(GID, exp, SECRET)
  assert.equal(edge, nodeBuildToken(GID, exp, SECRET))
})

test('edge token verifies under the Worker logic for the right gallery, not yet expired', async () => {
  const now = Date.now()
  const token = await buildGallerySessionToken(GID, now + 30 * 60_000, SECRET)
  assert.equal(workerVerify(token, GID, SECRET, now), true)
})

test('Worker rejects the token for a different gallery id', async () => {
  const now = Date.now()
  const token = await buildGallerySessionToken(GID, now + 30 * 60_000, SECRET)
  assert.equal(workerVerify(token, 'ffffffff-0000-4000-8000-000000000002', SECRET, now), false)
})

test('Worker rejects an expired token', async () => {
  const now = Date.now()
  const token = await buildGallerySessionToken(GID, now - 1, SECRET)
  assert.equal(workerVerify(token, GID, SECRET, now), false)
})

test('Worker rejects a tampered signature', async () => {
  const now = Date.now()
  const token = await buildGallerySessionToken(GID, now + 30 * 60_000, SECRET)
  const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
  assert.equal(workerVerify(tampered, GID, SECRET, now), false)
})

test('Worker rejects a token signed with a different secret', async () => {
  const now = Date.now()
  const token = await buildGallerySessionToken(GID, now + 30 * 60_000, 'other-secret')
  assert.equal(workerVerify(token, GID, SECRET, now), false)
})
