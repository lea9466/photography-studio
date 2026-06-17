export type MediaBucket =
  | 'originals'
  | 'previews'
  | 'watermarked'
  | 'edited'
  | 'zips'
  | 'branding'

export type R2UploadRequest = {
  bucket: MediaBucket
  path: string
  contentType: string
}
