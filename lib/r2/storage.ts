import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client } from '@/lib/r2/client'
import { galleryMediaProxyUrl, getR2Config } from '@/lib/r2/config'
import { r2ObjectKey } from '@/lib/r2/keys'
import type { MediaBucket } from '@/lib/r2/types'

const PRIVATE_BUCKETS = new Set<MediaBucket>(['originals', 'edited', 'zips'])

function canUsePublicUrl(bucket: MediaBucket) {
  if (PRIVATE_BUCKETS.has(bucket)) return false
  return Boolean(getR2Config().publicUrl)
}

export async function createPresignedUploadUrl(
  bucket: MediaBucket,
  path: string,
  contentType: string,
  expiresIn = 3600
) {
  const { bucketName } = getR2Config()
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: r2ObjectKey(bucket, path),
    ContentType: contentType || 'application/octet-stream',
  })

  return getSignedUrl(getR2Client(), command, { expiresIn })
}

export async function createPresignedDownloadUrl(
  bucket: MediaBucket,
  path: string,
  expiresIn = 3600,
  options?: { filename?: string }
) {
  const { bucketName } = getR2Config()
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: r2ObjectKey(bucket, path),
    ...(options?.filename
      ? {
          ResponseContentDisposition: `attachment; filename="${options.filename}"`,
        }
      : {}),
  })

  return getSignedUrl(getR2Client(), command, { expiresIn })
}

export async function resolveMediaUrl(bucket: MediaBucket, path: string | null, galleryId?: string) {
  if (!path) return null

  const { publicUrl } = getR2Config()
  const key = r2ObjectKey(bucket, path)
  if (canUsePublicUrl(bucket) && publicUrl) {
    return `${publicUrl}/${key}`
  }
  if (canUsePublicUrl(bucket) && !publicUrl) {
    return galleryMediaProxyUrl(key, galleryId)
  }

  return createPresignedDownloadUrl(bucket, path)
}

export async function signMediaPaths(
  bucket: MediaBucket,
  paths: (string | null)[],
  galleryId?: string
) {
  const unique = [...new Set(paths.filter(Boolean))] as string[]
  const map: Record<string, string> = {}

  await Promise.all(
    unique.map(async (path) => {
      const url = await resolveMediaUrl(bucket, path, galleryId)
      if (url) map[path] = url
    })
  )

  return map
}

export async function downloadMediaObject(bucket: MediaBucket, path: string) {
  const { bucketName } = getR2Config()
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: r2ObjectKey(bucket, path),
    })
  )

  if (!response.Body) {
    throw new Error(`קובץ לא נמצא: ${path}`)
  }

  return new Uint8Array(await response.Body.transformToByteArray())
}

export async function uploadMediaObject(
  bucket: MediaBucket,
  path: string,
  body: Uint8Array | Buffer,
  contentType: string
) {
  const { bucketName } = getR2Config()
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: r2ObjectKey(bucket, path),
      Body: body,
      ContentType: contentType,
    })
  )
}

export async function deleteMediaObject(bucket: MediaBucket, path: string) {
  const { bucketName } = getR2Config()
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: r2ObjectKey(bucket, path),
    })
  )
}
