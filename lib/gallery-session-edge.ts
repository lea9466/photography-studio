import { requireSessionSecret } from '@/lib/session-secret'

/**
 * Edge-runtime build of the private-gallery session token, byte-identical to
 * `lib/gallery-session.ts`'s Node `buildToken` and to the Worker's
 * `verifyGallerySessionToken` (`workers/gallery-media-guard/worker.js`).
 *
 * Used by the Next.js middleware (Edge runtime — `node:crypto` is unavailable
 * there) to mint `sg_gallery_<id>` for the *owning photographer*, so her
 * dashboard view of a private client gallery loads through the
 * content-filter-exempt subdomain exactly like the client's does. The client's
 * own minting path (`setGallerySession` after the password gate) is unchanged.
 *
 * Token shape: `<galleryId>:<expMs>:<hmacHex>` where the HMAC is
 * HMAC-SHA256(`<galleryId>:<expMs>`, GALLERY_SESSION_SECRET), hex-encoded.
 */

export const GALLERY_SESSION_COOKIE_PREFIX = 'sg_gallery_'
export const GALLERY_SESSION_IDLE_TIMEOUT_SEC = 30 * 60

export function getGallerySessionSecret(): string {
  return requireSessionSecret('GALLERY_SESSION_SECRET', 'dev-gallery-secret')
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Produces the same string `lib/gallery-session.ts`'s `buildToken` would for the
 * same `(galleryId, expMs)` — verified by `scripts/test-gallery-session-edge.ts`.
 */
export async function buildGallerySessionToken(
  galleryId: string,
  expMs: number,
  secret: string
): Promise<string> {
  const payload = `${galleryId}:${expMs}`
  return `${payload}:${await hmacHex(secret, payload)}`
}

/**
 * `.<app host>` in production (so the browser sends the cookie to the
 * `private.` subdomain too), `undefined` elsewhere. Mirrors
 * `lib/gallery-session.ts`'s `cookieDomain()`.
 */
export function gallerySessionCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined
  try {
    const host = new URL(process.env.NEXT_PUBLIC_APP_URL ?? '').hostname
    return host ? `.${host}` : undefined
  } catch {
    return undefined
  }
}
