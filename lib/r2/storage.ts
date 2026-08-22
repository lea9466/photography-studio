import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client } from '@/lib/r2/client'
import { galleryMediaProxyUrl, getR2Config } from '@/lib/r2/config'
import { signEdgeUrl } from '@/lib/r2/edge-signing'
import { r2ObjectKey } from '@/lib/r2/keys'
import type { MediaBucket } from '@/lib/r2/types'

const PRIVATE_BUCKETS = new Set<MediaBucket>(['originals', 'edited', 'zips'])

/**
 * These bucket types are the ones the gallery-media-guard Worker (workers/gallery-media-guard)
 * requires a signed ?exp&sig for on every request — see signEdgeUrl. branding/cover-images
 * stay bare/unsigned (never gallery-privacy-sensitive; e.g. OG image crawlers need them
 * fetchable unauthenticated).
 */
const SIGNED_EDGE_BUCKETS = new Set<MediaBucket>(['previews', 'watermarked'])

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

export async function mediaObjectExists(bucket: MediaBucket, path: string): Promise<boolean> {
  const normalizedPath = path.trim()
  if (!normalizedPath) return false

  const { bucketName } = getR2Config()
  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: r2ObjectKey(bucket, normalizedPath),
      })
    )
    return true
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    if (status === 404) return false
    const name = (error as { name?: string }).name
    if (name === 'NotFound' || name === 'NoSuchKey') return false
    return false
  }
}

/**
 * `forceProxy` must be true whenever the caller cannot guarantee the media
 * belongs to a genuinely public gallery. `previews`/`watermarked` are
 * bucket-type "public-eligible", but that says nothing about whether THIS
 * gallery is private — a direct public-CDN URL, on its own, stays fetchable
 * by anyone who obtains it, with no auth check.
 *
 * For a public gallery, resolveMediaUrl signs the URL (~24h rolling expiry —
 * see lib/r2/edge-signing.ts) so the gallery-media-guard Worker can verify it
 * without a session, keeping the CDN's full caching benefit.
 *
 * For a private gallery, the URL is left bare on purpose — authorization
 * comes from the gallery session cookie instead (scoped to the shared parent
 * domain in production, see cookieDomain() in lib/gallery-session.ts), which
 * the Worker checks directly. This is deliberately *browser-bound* rather
 * than *link-bound*: a signed-but-shareable URL would still let anyone who
 * gets the link open it from any browser for as long as it's valid, which a
 * private gallery must not allow — only the browser that actually passed the
 * password gate may see the photos.
 */
export async function resolveMediaUrl(
  bucket: MediaBucket,
  path: string | null,
  galleryId?: string,
  forceProxy = false
) {
  if (!path) return null

  const { publicUrl } = getR2Config()
  const key = r2ObjectKey(bucket, path)

  if (canUsePublicUrl(bucket) && publicUrl) {
    if (SIGNED_EDGE_BUCKETS.has(bucket) && !forceProxy) {
      return signEdgeUrl(publicUrl, bucket, path)
    }
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
  galleryId?: string,
  forceProxy = false
) {
  const unique = [...new Set(paths.filter(Boolean))] as string[]
  const map: Record<string, string> = {}

  await Promise.all(
    unique.map(async (path) => {
      const url = await resolveMediaUrl(bucket, path, galleryId, forceProxy)
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

const DELETE_OBJECTS_BATCH_SIZE = 1000

export async function deleteMediaPrefix(bucket: MediaBucket, prefix: string) {
  const { bucketName } = getR2Config()
  const fullPrefix = r2ObjectKey(bucket, prefix.replace(/^\/+/, ''))
  let continuationToken: string | undefined

  do {
    const list = await getR2Client().send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: fullPrefix,
        ContinuationToken: continuationToken,
      })
    )

    const keys = (list.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key))

    for (let offset = 0; offset < keys.length; offset += DELETE_OBJECTS_BATCH_SIZE) {
      const chunk = keys.slice(offset, offset + DELETE_OBJECTS_BATCH_SIZE)
      if (chunk.length === 0) continue

      await getR2Client().send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: chunk.map((Key) => ({ Key })),
          },
        })
      )
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (continuationToken)
}

export async function deleteR2ObjectKey(key: string) {
  const normalizedKey = key.replace(/^\/+/, '').trim()
  if (!normalizedKey) return

  const { bucketName } = getR2Config()
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: normalizedKey,
    })
  )
}

/**
 * Batches deletes via S3's DeleteObjects (up to 1000 keys/call), grouped by
 * bucket, instead of one DeleteObjectCommand round-trip per file. A bulk
 * gallery delete with hundreds of photos previously issued thousands of
 * sequential single-object deletes and could blow the serverless function's
 * execution timeout.
 */
export async function deleteMediaObjects(
  objects: { bucket: MediaBucket; path: string }[]
) {
  const { bucketName } = getR2Config()

  const keysByBucket = new Map<MediaBucket, Set<string>>()
  for (const { bucket, path } of objects) {
    const trimmed = path.trim()
    if (!trimmed) continue
    if (!keysByBucket.has(bucket)) keysByBucket.set(bucket, new Set())
    keysByBucket.get(bucket)!.add(r2ObjectKey(bucket, trimmed))
  }

  for (const [, keys] of keysByBucket) {
    const keyList = [...keys]
    for (let offset = 0; offset < keyList.length; offset += DELETE_OBJECTS_BATCH_SIZE) {
      const chunk = keyList.slice(offset, offset + DELETE_OBJECTS_BATCH_SIZE)
      await getR2Client().send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: chunk.map((Key) => ({ Key })) },
        })
      )
    }
  }
}
