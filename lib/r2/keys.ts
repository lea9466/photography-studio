import type { MediaBucket } from '@/lib/r2/types'

export function r2ObjectKey(bucket: MediaBucket, path: string) {
  return `${bucket}/${path}`
}
