/**
 * Sits in front of the public R2 custom domain (albums.studio-galleries.com).
 * That domain used to be bound straight to the R2 bucket, which served every
 * object unconditionally to anyone with the URL, forever — bypassing the
 * Next.js app's session checks entirely (see app/api/gallery-media/route.ts
 * and lib/gallery-session.ts for the app-side half of this fix).
 *
 * Policy is deliberately uniform for previews/watermarked: every request must
 * carry a valid, unexpired ?exp&sig. There is no "no signature = allow"
 * fallback for public galleries — that would be bypassable by simply
 * stripping the query string off a leaked private-gallery link. The
 * public/private distinction lives only in how long lib/r2/edge-signing.ts
 * makes that signature valid for (see signEdgeUrl): public galleries get an
 * expiry rounded to the next UTC midnight (same URL/cache entry all day,
 * shared across every visitor), private galleries get a real ~30 minute TTL.
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
      if (!exp || !sig) return new Response('Forbidden', { status: 403 })

      const expected = await hmacHex(env.R2_EDGE_SIGNING_SECRET, `${key}:${exp}`)
      if (!timingSafeEqual(sig, expected)) return new Response('Forbidden', { status: 403 })
      if (Math.floor(Date.now() / 1000) > Number(exp)) {
        return new Response('Forbidden', { status: 403 })
      }

      return serve(env, key)
    }

    // originals/edited/zips and anything unrecognized: never served via this
    // public domain, signed or not — those go through the app's authenticated
    // proxy / S3 presigned URLs instead (see lib/r2/storage.ts).
    return new Response('Forbidden', { status: 403 })
  },
}
