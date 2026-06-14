export type MediaBucket =
  | 'originals'
  | 'previews'
  | 'watermarked'
  | 'edited'
  | 'zips'

export type R2UploadRequest = {
  bucket: MediaBucket
  path: string
  contentType: string
}
