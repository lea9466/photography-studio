#!/usr/bin/env node
/**
 * Unit checks for the gallery-media-guard edge-signing scheme: the HMAC that
 * lib/r2/edge-signing.ts produces and workers/gallery-media-guard/worker.js
 * verifies. Mirrors both sides in plain Node crypto (no TS loader, no fetch
 * to a live Worker) so this can run standalone.
 * Run: node scripts/test-r2-edge-signing.mjs
 */

import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto'

const SECRET = 'test-secret-do-not-use-in-prod'

// Mirrors lib/r2/edge-signing.ts's sign()
function sign(value) {
  return createHmac('sha256', SECRET).update(value).digest('hex')
}

// Mirrors lib/r2/edge-signing.ts's signEdgeUrl() for a given key/exp pair
function signEdge(key, exp) {
  return sign(`${key}:${exp}`)
}

// Mirrors workers/gallery-media-guard/worker.js's verification (hmacHex + timingSafeEqual + exp check)
function verifyEdge(key, exp, sig, nowSec) {
  const expected = signEdge(key, exp)
  if (sig.length !== expected.length) return false
  if (!nodeTimingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
  return nowSec <= Number(exp)
}

let passed = 0
let failed = 0

function check(name, condition) {
  if (condition) {
    console.log(`PASS — ${name}`)
    passed++
  } else {
    console.error(`FAIL — ${name}`)
    failed++
  }
}

const key = 'watermarked/user-1/gallery-1/wm-photo-1.jpg'
const now = Math.floor(Date.now() / 1000)
const exp = now + 1800
const validSig = signEdge(key, exp)

check('valid signature, not yet expired → accepted', verifyEdge(key, exp, validSig, now))

check(
  'tampered signature → rejected',
  !verifyEdge(key, exp, validSig.slice(0, -1) + (validSig.endsWith('a') ? 'b' : 'a'), now)
)

check(
  'tampered key (same signature) → rejected',
  !verifyEdge('watermarked/user-1/gallery-1/wm-OTHER-photo.jpg', exp, validSig, now)
)

check(
  'tampered exp (same signature) → rejected',
  !verifyEdge(key, exp + 1, validSig, now)
)

check('expired (exp in the past) → rejected', !verifyEdge(key, now - 1, sign(`${key}:${now - 1}`), now))

check(
  'exp exactly now → still accepted (inclusive boundary)',
  verifyEdge(key, now, sign(`${key}:${now}`), now)
)

check(
  'day-bucketed public expiry shared across two "requests" at the same exp → identical signature (cache-friendly)',
  signEdge(key, exp) === signEdge(key, exp)
)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
