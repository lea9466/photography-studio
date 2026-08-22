import { createHmac } from 'crypto'
import { r2ObjectKey } from '@/lib/r2/keys'
import type { MediaBucket } from '@/lib/r2/types'

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

/**
 * At least 24h from now, rounded up to the next hour boundary — not a fixed
 * clock time like midnight. Rounding to the hour still lets visitors hitting
 * the same gallery within that hour share one cacheable URL, but avoids a
 * single global cliff where every signed link on the whole site (regardless
 * of when it was generated) goes stale at once. A fixed-midnight expiry also
 * meant a page rendered right before midnight got a link valid for only
 * minutes, while one rendered right after got almost a full day — this
 * guarantees a consistent ~24-25h minimum no matter when the page rendered.
 */
function rolling24hExpirySec() {
  const nowSec = Math.floor(Date.now() / 1000)
  const nextHourBoundary = Math.ceil(nowSec / 3600) * 3600
  return nextHourBoundary + 24 * 60 * 60
}

/**
 * Signs a URL for a *public* gallery's previews/watermarked object, for the
 * gallery-media-guard Cloudflare Worker (workers/gallery-media-guard) sitting
 * in front of the public R2 CDN domain.
 *
 * Private galleries don't use this at all — see the comment on
 * resolveMediaUrl (lib/r2/storage.ts) for why the Worker instead checks the
 * gallery session cookie directly for those.
 */
export function signEdgeUrl(publicUrl: string, bucket: MediaBucket, path: string) {
  const key = r2ObjectKey(bucket, path)
  const exp = rolling24hExpirySec()
  const sig = sign(`${key}:${exp}`)
  return `${publicUrl}/${key}?exp=${exp}&sig=${sig}`
}

/**
 * Signs a short-lived download link for ANY bucket, including the sensitive
 * ones (originals/edited/zips) — routed through albums.studio-galleries.com
 * and the gallery-media-guard Worker instead of R2's raw S3-API endpoint
 * (*.r2.cloudflarestorage.com), which some client-side content filters block
 * outright as an unrecognized domain. This carries the same security
 * property as the S3 presigned URL it replaces (unguessable, time-limited)
 * — the actual authorization decision (who's allowed to download what) has
 * already happened server-side in the caller before this is ever minted;
 * this just proves the link came from our server and bounds it in time.
 */
export function signDownloadUrl(
  publicUrl: string,
  bucket: MediaBucket,
  path: string,
  expiresInSec: number
) {
  const key = r2ObjectKey(bucket, path)
  const exp = Math.floor(Date.now() / 1000) + expiresInSec
  const sig = sign(`${key}:${exp}`)
  return `${publicUrl}/${key}?exp=${exp}&sig=${sig}`
}
