import { signMediaPaths } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'

export async function signStoragePaths(
  bucket: MediaBucket,
  paths: (string | null)[],
  galleryId?: string
) {
  return signMediaPaths(bucket, paths, galleryId)
}
