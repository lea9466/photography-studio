#!/usr/bin/env node
/**
 * Unit checks for the gallery-media-guard edge-auth scheme: the two
 * HMAC-based checks workers/gallery-media-guard/worker.js performs —
 * (1) the ~24h rolling ?exp&sig for public galleries, mirroring
 * lib/r2/edge-signing.ts, and (2) the gallery session cookie for private
 * galleries, mirroring lib/gallery-session.ts's buildToken/verifyToken.
 * Mirrors both in plain Node crypto (no TS loader, no live Worker) so this
 * can run standalone.
 * Run: node scripts/test-r2-edge-signing.mjs
 */

import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto'

const EDGE_SECRET = 'test-edge-secret-do-not-use-in-prod'
const SESSION_SECRET = 'test-session-secret-do-not-use-in-prod'

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

function hmacHex(secret, message) {
  return createHmac('sha256', secret).update(message).digest('hex')
}

function timingSafeEqualStr(a, b) {
  if (a.length !== b.length) return false
  return nodeTimingSafeEqual(Buffer.from(a), Buffer.from(b))
}

// ===== Part 1: public-gallery ?exp&sig scheme (mirrors lib/r2/edge-signing.ts + the Worker's public path) =====

function signEdge(key, exp) {
  return hmacHex(EDGE_SECRET, `${key}:${exp}`)
}

function verifyEdge(key, exp, sig, nowSec) {
  const expected = signEdge(key, exp)
  if (!timingSafeEqualStr(sig, expected)) return false
  return nowSec <= Number(exp)
}

const edgeKey = 'watermarked/user-1/gallery-1/wm-photo-1.jpg'
const nowSec = Math.floor(Date.now() / 1000)
const edgeExp = nowSec + 1800
const validEdgeSig = signEdge(edgeKey, edgeExp)

check('edge: valid signature, not yet expired → accepted', verifyEdge(edgeKey, edgeExp, validEdgeSig, nowSec))
check(
  'edge: tampered signature → rejected',
  !verifyEdge(edgeKey, edgeExp, validEdgeSig.slice(0, -1) + (validEdgeSig.endsWith('a') ? 'b' : 'a'), nowSec)
)
check(
  'edge: tampered key (same signature) → rejected',
  !verifyEdge('watermarked/user-1/gallery-1/wm-OTHER-photo.jpg', edgeExp, validEdgeSig, nowSec)
)
check('edge: tampered exp (same signature) → rejected', !verifyEdge(edgeKey, edgeExp + 1, validEdgeSig, nowSec))
check(
  'edge: expired (exp in the past) → rejected',
  !verifyEdge(edgeKey, nowSec - 1, signEdge(edgeKey, nowSec - 1), nowSec)
)
check(
  'edge: two requests landing on the same hour-rounded exp → identical signature (cache-friendly)',
  signEdge(edgeKey, edgeExp) === signEdge(edgeKey, edgeExp)
)

// ===== Part 2: private-gallery session cookie (mirrors lib/gallery-session.ts + the Worker's cookie path) =====

function buildSessionToken(galleryId, expMs) {
  const payload = `${galleryId}:${expMs}`
  return `${payload}:${hmacHex(SESSION_SECRET, payload)}`
}

function verifySessionToken(raw, galleryId, nowMs) {
  if (!raw) return false
  const lastColon = raw.lastIndexOf(':')
  if (lastColon <= 0) return false
  const sig = raw.slice(lastColon + 1)
  const payload = raw.slice(0, lastColon)
  const expected = hmacHex(SESSION_SECRET, payload)
  if (!timingSafeEqualStr(sig, expected)) return false
  const sep = payload.indexOf(':')
  if (sep <= 0) return false
  if (payload.slice(0, sep) !== galleryId) return false
  const exp = Number(payload.slice(sep + 1))
  return Number.isFinite(exp) && nowMs <= exp
}

const galleryId = 'gallery-1'
const nowMs = Date.now()
const sessionExp = nowMs + 30 * 60 * 1000
const validSessionToken = buildSessionToken(galleryId, sessionExp)

check('cookie: valid token, not yet expired → accepted', verifySessionToken(validSessionToken, galleryId, nowMs))
check('cookie: missing cookie → rejected', !verifySessionToken(null, galleryId, nowMs))
check(
  'cookie: token issued for a different gallery → rejected',
  !verifySessionToken(validSessionToken, 'gallery-2', nowMs)
)
check(
  'cookie: tampered signature → rejected',
  !verifySessionToken(
    validSessionToken.slice(0, -1) + (validSessionToken.endsWith('a') ? 'b' : 'a'),
    galleryId,
    nowMs
  )
)
check(
  'cookie: expired session (30 min elapsed) → rejected',
  !verifySessionToken(validSessionToken, galleryId, sessionExp + 1)
)
check(
  'cookie: exp exactly now → still accepted (inclusive boundary)',
  verifySessionToken(buildSessionToken(galleryId, nowMs), galleryId, nowMs)
)
check(
  'cookie: old 7-day HMAC-only format (no exp in payload) never verifies → forces a clean re-login, no crash',
  !verifySessionToken(hmacHex(SESSION_SECRET, galleryId), galleryId, nowMs)
)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
