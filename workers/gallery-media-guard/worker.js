/**
 * Sits in front of the public R2 custom domain (albums.studio-galleries.com).
 * That domain used to be bound straight to the R2 bucket, which served every
 * object unconditionally to anyone with the URL, forever — bypassing the
 * Next.js app's session checks entirely.
 *
 * Two separate authorization paths for previews/watermarked, chosen by
 * whether the request carries a signed ?exp&sig query string:
 *
 * - Present (public gallery): must be a valid, unexpired HMAC signature
 *   (see lib/r2/edge-signing.ts). Expiry rolls ~24h forward from generation,
 *   rounded to the hour, so visitors hitting the same gallery within that
 *   hour share one cacheable URL. No cookie needed; a public gallery has
 *   nothing to hide.
 *
 * - Absent (private gallery): the URL itself carries no proof of anything —
 *   authorization instead comes from the gallery session cookie
 *   (sg_gallery_<galleryId>), which the browser only has after passing the
 *   password gate, and which lib/gallery-session.ts scopes to the shared
 *   parent domain in production so it actually reaches this Worker. This is
 *   deliberately browser-bound: a copied/shared link alone proves nothing.
 *
 * Either way there is no bypass by omission — a request with no signature
 * AND no valid cookie is rejected, full stop.
 */

async function hmacHex(secret, message) {
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

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** key = "previews/<userId>/<galleryId>/<filename>" or "watermarked/...". */
function galleryIdFromKey(key) {
  const parts = key.split('/')
  return parts.length >= 3 ? parts[2] : null
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim())
    }
  }
  return null
}

/** Mirrors lib/gallery-session.ts's verifyToken exactly — same secret, same
 * payload shape (`${galleryId}:${exp}:${sig}`), same units (exp in ms). */
async function verifyGallerySessionToken(raw, galleryId, secret) {
  if (!raw) return false

  const lastColon = raw.lastIndexOf(':')
  if (lastColon <= 0) return false

  const sig = raw.slice(lastColon + 1)
  const payload = raw.slice(0, lastColon)
  const expected = await hmacHex(secret, payload)
  if (!timingSafeEqual(sig, expected)) return false

  const sep = payload.indexOf(':')
  if (sep <= 0) return false
  if (payload.slice(0, sep) !== galleryId) return false

  const exp = Number(payload.slice(sep + 1))
  return Number.isFinite(exp) && Date.now() <= exp
}

async function serve(env, key) {
  const object = await env.GALLERY_BUCKET.get(key)
  if (!object) return new Response('Not Found', { status: 404 })

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=86400')
  return new Response(object.body, { headers })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const key = url.pathname.replace(/^\/+/, '')

    if (key.startsWith('branding/') || key.startsWith('cover-images/')) {
      return serve(env, key)
    }

    if (key.startsWith('previews/') || key.startsWith('watermarked/')) {
      const exp = url.searchParams.get('exp')
      const sig = url.searchParams.get('sig')

      if (exp && sig) {
        // Public-gallery path: must be a valid, unexpired signature. No
        // cookie fallback here — a bad/expired signature is just rejected.
        const expected = await hmacHex(env.R2_EDGE_SIGNING_SECRET, `${key}:${exp}`)
        const notExpired = Math.floor(Date.now() / 1000) <= Number(exp)
        if (timingSafeEqual(sig, expected) && notExpired) {
          return serve(env, key)
        }
        return new Response('Forbidden', { status: 403 })
      }

      // No signature at all: private-gallery path — must have a valid,
      // browser-bound session cookie for this specific gallery.
      const galleryId = galleryIdFromKey(key)
      if (galleryId) {
        const raw = getCookie(request, `sg_gallery_${galleryId}`)
        if (await verifyGallerySessionToken(raw, galleryId, env.GALLERY_SESSION_SECRET)) {
          return serve(env, key)
        }
      }

      return new Response('Forbidden', { status: 403 })
    }

    // originals/edited/zips and anything unrecognized: never served via this
    // public domain, signed or not — those go through the app's authenticated
    // proxy / S3 presigned URLs instead (see lib/r2/storage.ts).
    return new Response('Forbidden', { status: 403 })
  },
}
