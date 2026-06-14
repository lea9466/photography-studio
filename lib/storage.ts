import { signMediaPaths } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'

export async function signStoragePaths(
  bucket: MediaBucket,
  paths: (string | null)[]
) {
  return signMediaPaths(bucket, paths)
}
