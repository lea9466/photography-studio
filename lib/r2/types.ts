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
  /** Actual size (bytes) of the file about to be uploaded, when known at
   * request time (e.g. a real user-selected File). Optional and only
   * enforced by callers that choose to validate it — server-generated
   * derivatives (previews/watermarked canvas blobs) don't need it. */
  fileSize?: number
}
