import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

import { requireSessionSecret } from '@/lib/session-secret'

const COOKIE_PREFIX = 'sg_gallery_'
const IDLE_TIMEOUT_SEC = 30 * 60

function getSecret() {
  return requireSessionSecret('GALLERY_SESSION_SECRET', 'dev-gallery-secret')
}

/**
 * The gallery page (private.studio-galleries.com) and the image CDN domain
 * (albums.studio-galleries.com) are different hostnames — a cookie scoped to
 * the exact host that set it would never reach the Worker guarding the CDN
 * domain. Scoping it to the shared parent domain instead makes the browser
 * send it to both, which is what lets the Worker require "this exact
 * browser's session", not just "anyone who has the URL". Only applied in
 * production — there's no shared parent domain to speak of in local dev.
 */
function cookieDomain() {
  if (process.env.NODE_ENV !== 'production') return undefined
  try {
    const host = new URL(process.env.NEXT_PUBLIC_APP_URL ?? '').hostname
    return host ? `.${host}` : undefined
  } catch {
    return undefined
  }
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

function safeEqual(a: string, b: string) {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

function buildToken(galleryId: string, exp: number) {
  const payload = `${galleryId}:${exp}`
  return `${payload}:${sign(payload)}`
}

function verifyToken(raw: string | undefined | null, galleryId: string): boolean {
  if (!raw) return false

  const lastColon = raw.lastIndexOf(':')
  if (lastColon <= 0) return false

  const sig = raw.slice(lastColon + 1)
  const payload = raw.slice(0, lastColon)
  if (!safeEqual(sign(payload), sig)) return false

  const sep = payload.indexOf(':')
  if (sep <= 0) return false
  if (payload.slice(0, sep) !== galleryId) return false

  const exp = Number(payload.slice(sep + 1))
  return Number.isFinite(exp) && Date.now() <= exp
}

export async function setGallerySession(galleryId: string) {
  const exp = Date.now() + IDLE_TIMEOUT_SEC * 1000
  const cookieStore = await cookies()
  cookieStore.set(`${COOKIE_PREFIX}${galleryId}`, buildToken(galleryId, exp), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: IDLE_TIMEOUT_SEC,
    path: '/',
    domain: cookieDomain(),
  })
}

/** Read-only check — safe to call from Server Components, which cannot write cookies. */
export async function hasGallerySession(galleryId: string) {
  const cookieStore = await cookies()
  return verifyToken(cookieStore.get(`${COOKIE_PREFIX}${galleryId}`)?.value, galleryId)
}

/**
 * Verifies the session AND slides its expiry another IDLE_TIMEOUT_SEC forward.
 * Only call from Route Handlers / Server Actions (contexts that can write cookies) —
 * viewing a gallery counts as activity, so every authorized media/download/selection
 * request should keep the session alive rather than letting it expire on a fixed TTL.
 */
export async function touchGallerySession(galleryId: string) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(`${COOKIE_PREFIX}${galleryId}`)?.value
  if (!verifyToken(raw, galleryId)) return false
  await setGallerySession(galleryId)
  return true
}

export async function clearGallerySession(galleryId: string) {
  const cookieStore = await cookies()
  cookieStore.delete(`${COOKIE_PREFIX}${galleryId}`)
}
