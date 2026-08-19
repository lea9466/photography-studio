import { createHmac } from 'crypto'
import { r2ObjectKey } from '@/lib/r2/keys'
import type { MediaBucket } from '@/lib/r2/types'

const PRIVATE_TTL_SEC = 30 * 60 // matches the gallery idle-session window (lib/gallery-session.ts)

function getSecret() {
  const value = process.env.R2_EDGE_SIGNING_SECRET?.trim()
  if (value) return value
  if (process.env.NODE_ENV === 'production') {
    throw new Error('R2_EDGE_SIGNING_SECRET is required in production')
  }
  return 'dev-r2-edge-secret'
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

function nextUtcMidnightExpirySec() {
  const now = new Date()
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.floor(next / 1000)
}

/**
 * Signs a URL for the gallery-media-guard Cloudflare Worker (workers/gallery-media-guard)
 * sitting in front of the public R2 CDN domain. The Worker requires a valid, unexpired
 * signature for every previews/watermarked request — there is no "unsigned = allowed"
 * fallback, because that would let anyone strip ?exp&sig off a private gallery's link to
 * regain permanent access. 'public' galleries get an expiry rounded to the next UTC
 * midnight so every visitor shares one cacheable URL for the day; 'private' galleries get
 * a short, real per-request TTL.
 */
export function signEdgeUrl(
  publicUrl: string,
  bucket: MediaBucket,
  path: string,
  kind: 'public' | 'private'
) {
  const key = r2ObjectKey(bucket, path)
  const exp =
    kind === 'private'
      ? Math.floor(Date.now() / 1000) + PRIVATE_TTL_SEC
      : nextUtcMidnightExpirySec()
  const sig = sign(`${key}:${exp}`)
  return `${publicUrl}/${key}?exp=${exp}&sig=${sig}`
}
