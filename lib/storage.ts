import { signMediaPaths } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'

export async function signStoragePaths(
  bucket: MediaBucket,
  paths: (string | null)[],
  galleryId?: string
) {
  return signMediaPaths(bucket, paths, galleryId)
}

/**
 * Like `signStoragePaths`, but for the owning photographer's dashboard view of
 * her own private (selection) gallery: the returned URLs point at the
 * content-filter-exempt `private.` subdomain (bare for previews/watermarked —
 * authorized by the `sg_gallery_<id>` cookie the middleware mints for the
 * owner). Falls back to the normal `albums.` URLs when the private subdomain
 * isn't configured. Only call from owner-gated code paths.
 */
export async function resolvePrivateGalleryPaths(
  bucket: MediaBucket,
  paths: (string | null)[]
) {
  return signMediaPaths(bucket, paths, undefined, false, true)
}
