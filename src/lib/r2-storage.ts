import 'server-only'

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  buildCoverObjectKey,
  buildDeterministicGalleryObjectKey,
  buildGalleryObjectKey,
  formatR2Error,
  getR2Client,
  r2BucketName,
  r2Configured,
  sanitizeGalleryId,
  uniqueR2FileName,
} from '@/lib/r2'
import { r2KeyFromPublicUrl, r2PublicConfigured, r2PublicUrlFromKey } from '@/lib/r2-public'

export async function getR2ObjectBytes(
  key: string
): Promise<{ data: Uint8Array | null; contentType: string | null; error: string | null }> {
  const bucket = r2BucketName()
  if (!bucket) {
    return { data: null, contentType: null, error: 'חסר R2_BUCKET_NAME ב-.env.local' }
  }

  try {
    const client = getR2Client()
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )

    const body = response.Body
    if (!body) {
      return { data: null, contentType: null, error: 'קובץ לא נמצא' }
    }

    const data = await body.transformToByteArray()
    return {
      data,
      contentType: response.ContentType ?? null,
      error: null,
    }
  } catch (error) {
    const err = error as { name?: string; Code?: string }
    if (err.name === 'NoSuchKey' || err.Code === 'NoSuchKey') {
      return { data: null, contentType: null, error: 'קובץ לא נמצא' }
    }
    return { data: null, contentType: null, error: formatR2Error(error) }
  }
}

export async function putR2Object(params: {
  key: string
  body: Buffer
  contentType: string
}): Promise<{ error: string | null }> {
  const bucket = r2BucketName()
  if (!bucket) return { error: 'חסר R2_BUCKET_NAME ב-.env.local' }

  try {
    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      })
    )
    return { error: null }
  } catch (error) {
    return { error: formatR2Error(error) }
  }
}

const GALLERY_PRESIGN_EXPIRES_SEC = 3600

export type GalleryMultipartPart = {
  ETag: string
  PartNumber: number
}

function galleryOriginalObjectKeyForUpload(
  galleryId: string,
  photographerId: string,
  imageId: string,
  originalExt: string
): { key: string; error: string | null } {
  const safeGalleryId = sanitizeGalleryId(galleryId)
  if (!safeGalleryId) {
    return { key: '', error: 'מזהה גלריה לא תקין' }
  }

  const safePhotographerId = sanitizeGalleryId(photographerId)
  if (!safePhotographerId) {
    return { key: '', error: 'מזהה צלם לא תקין' }
  }

  const key = buildDeterministicGalleryObjectKey(
    safeGalleryId,
    imageId.trim(),
    'original',
    originalExt,
    safePhotographerId
  )
  if (!key) {
    return { key: '', error: 'מזהה תמונה או גלריה לא תקין' }
  }

  return { key, error: null }
}

/** ייזום Multipart Upload לקובץ מקור גדול (ללא מעבר דרך זיכרון השרת). */
export async function createGalleryMultipartUpload(
  galleryId: string,
  photographerId: string,
  imageId: string,
  originalExt: string,
  contentType: string
): Promise<{ key: string; uploadId: string; error: string | null }> {
  const bucket = r2BucketName()
  if (!bucket) {
    return { key: '', uploadId: '', error: 'חסר R2_BUCKET_NAME ב-.env.local' }
  }

  const { key, error: keyError } = galleryOriginalObjectKeyForUpload(
    galleryId,
    photographerId,
    imageId,
    originalExt
  )
  if (keyError || !key) {
    return { key: '', uploadId: '', error: keyError || 'מפתח R2 לא תקין' }
  }

  try {
    const client = getR2Client()
    const response = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      })
    )

    const uploadId = response.UploadId?.trim()
    if (!uploadId) {
      return { key: '', uploadId: '', error: 'R2 לא החזיר uploadId' }
    }

    return { key, uploadId, error: null }
  } catch (error) {
    return { key: '', uploadId: '', error: formatR2Error(error) }
  }
}

/** Presigned PUT לחלק בודד ב-Multipart Upload. */
export async function createGalleryMultipartPartUrl(
  galleryId: string,
  photographerId: string,
  imageId: string,
  originalExt: string,
  uploadId: string,
  partNumber: number
): Promise<{ url: string; error: string | null }> {
  const bucket = r2BucketName()
  if (!bucket) {
    return { url: '', error: 'חסר R2_BUCKET_NAME ב-.env.local' }
  }

  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) {
    return { url: '', error: 'מספר חלק לא תקין' }
  }

  const cleanUploadId = uploadId.trim()
  if (!cleanUploadId) {
    return { url: '', error: 'חסר uploadId' }
  }

  const { key, error: keyError } = galleryOriginalObjectKeyForUpload(
    galleryId,
    photographerId,
    imageId,
    originalExt
  )
  if (keyError || !key) {
    return { url: '', error: keyError || 'מפתח R2 לא תקין' }
  }

  try {
    const client = getR2Client()
    const url = await getSignedUrl(
      client,
      new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: cleanUploadId,
        PartNumber: partNumber,
      }),
      { expiresIn: GALLERY_PRESIGN_EXPIRES_SEC }
    )
    return { url, error: null }
  } catch (error) {
    return { url: '', error: formatR2Error(error) }
  }
}

/** סיום והרכבת קובץ מקור מ-Multipart Upload. */
export async function completeGalleryMultipartUpload(
  galleryId: string,
  photographerId: string,
  imageId: string,
  originalExt: string,
  uploadId: string,
  parts: GalleryMultipartPart[]
): Promise<{ error: string | null }> {
  const bucket = r2BucketName()
  if (!bucket) {
    return { error: 'חסר R2_BUCKET_NAME ב-.env.local' }
  }

  const cleanUploadId = uploadId.trim()
  if (!cleanUploadId) {
    return { error: 'חסר uploadId' }
  }

  if (!parts.length) {
    return { error: 'חסרים חלקי העלאה' }
  }

  const { key, error: keyError } = galleryOriginalObjectKeyForUpload(
    galleryId,
    photographerId,
    imageId,
    originalExt
  )
  if (keyError || !key) {
    return { error: keyError || 'מפתח R2 לא תקין' }
  }

  const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber)

  try {
    const client = getR2Client()
    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: cleanUploadId,
        MultipartUpload: {
          Parts: sortedParts.map((part) => ({
            ETag: part.ETag,
            PartNumber: part.PartNumber,
          })),
        },
      })
    )
    return { error: null }
  } catch (error) {
    return { error: formatR2Error(error) }
  }
}

/** ביטול Multipart Upload שלא הושלם (מניעת שאריות ב-R2). */
export async function abortGalleryMultipartUpload(
  galleryId: string,
  photographerId: string,
  imageId: string,
  originalExt: string,
  uploadId: string
): Promise<{ error: string | null }> {
  const bucket = r2BucketName()
  if (!bucket) {
    return { error: 'חסר R2_BUCKET_NAME ב-.env.local' }
  }

  const cleanUploadId = uploadId.trim()
  if (!cleanUploadId) {
    return { error: 'חסר uploadId' }
  }

  const { key, error: keyError } = galleryOriginalObjectKeyForUpload(
    galleryId,
    photographerId,
    imageId,
    originalExt
  )
  if (keyError || !key) {
    return { error: keyError || 'מפתח R2 לא תקין' }
  }

  try {
    const client = getR2Client()
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: cleanUploadId,
      })
    )
    return { error: null }
  } catch (error) {
    return { error: formatR2Error(error) }
  }
}

export type GalleryPresignedPut = {
  key: string
  uploadUrl: string
  url: string
}

export type GalleryPresignBatchItem = {
  imageId: string
  originalExt: string
  contentType: string
}

/** Presigned PUT — העלאה ישירה מהדפדפן ל-R2 בלי לעבור דרך זיכרון השרת. */
export async function createGalleryPresignedPutUrl(
  galleryId: string,
  photographerId: string,
  originalFileName: string,
  contentType: string,
  isCompressed: boolean,
  options?: { imageId?: string; originalExt?: string | null }
): Promise<{
  key: string
  uploadUrl: string
  url: string
  error: string | null
}> {
  const safeGalleryId = sanitizeGalleryId(galleryId)
  if (!safeGalleryId) {
    return { key: '', uploadUrl: '', url: '', error: 'מזהה גלריה לא תקין' }
  }

  const bucket = r2BucketName()
  if (!bucket) {
    return { key: '', uploadUrl: '', url: '', error: 'חסר R2_BUCKET_NAME ב-.env.local' }
  }

  const safePhotographerId = sanitizeGalleryId(photographerId)
  if (!safePhotographerId) {
    return { key: '', uploadUrl: '', url: '', error: 'מזהה צלם לא תקין' }
  }

  const imageId = options?.imageId?.trim()
  const key = imageId
    ? buildDeterministicGalleryObjectKey(
        safeGalleryId,
        imageId,
        isCompressed ? 'thumbnail' : 'original',
        options?.originalExt,
        safePhotographerId
      )
    : buildGalleryObjectKey(
        safeGalleryId,
        uniqueR2FileName(originalFileName),
        isCompressed,
        safePhotographerId
      )

  if (!key) {
    return { key: '', uploadUrl: '', url: '', error: 'מזהה תמונה או גלריה לא תקין' }
  }

  try {
    const client = getR2Client()
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      }),
      { expiresIn: GALLERY_PRESIGN_EXPIRES_SEC }
    )

    const url = r2PublicUrlFromKey(key)
    if (!r2PublicConfigured()) {
      return {
        key,
        uploadUrl: '',
        url: '',
        error:
          'חסר NEXT_PUBLIC_R2_PUBLIC_URL (או R2_PUBLIC_URL) — לא ניתן ליצור קישור ציבורי',
      }
    }

    return { key, uploadUrl, url, error: null }
  } catch (error) {
    return { key: '', uploadUrl: '', url: '', error: formatR2Error(error) }
  }
}

/** הנפקת presign למקור + thumbnail לכל פריט — ללא פניות נוספות ל-DB/R2. */
export async function createGalleryPresignedPutUrlBatch(
  galleryId: string,
  photographerId: string,
  items: GalleryPresignBatchItem[]
): Promise<{
  urls: Record<string, { original: GalleryPresignedPut; thumbnail: GalleryPresignedPut }>
  error: string | null
}> {
  const urls: Record<
    string,
    { original: GalleryPresignedPut; thumbnail: GalleryPresignedPut }
  > = {}

  const entries = await Promise.all(
    items.map(async (item) => {
      const [original, thumbnail] = await Promise.all([
        createGalleryPresignedPutUrl(
          galleryId,
          photographerId,
          `original.${item.originalExt}`,
          item.contentType || 'application/octet-stream',
          false,
          { imageId: item.imageId, originalExt: item.originalExt }
        ),
        createGalleryPresignedPutUrl(
          galleryId,
          photographerId,
          'thumbnail.webp',
          'image/webp',
          true,
          { imageId: item.imageId, originalExt: item.originalExt }
        ),
      ])

      return { item, original, thumbnail }
    })
  )

  for (const { item, original, thumbnail } of entries) {
    if (original.error || !original.uploadUrl) {
      return { urls: {}, error: original.error || 'שגיאה ביצירת קישור העלאה למקור' }
    }
    if (thumbnail.error || !thumbnail.uploadUrl) {
      return {
        urls: {},
        error: thumbnail.error || 'שגיאה ביצירת קישור העלאה למיניאטורה',
      }
    }

    urls[item.imageId] = {
      original: {
        key: original.key,
        uploadUrl: original.uploadUrl,
        url: original.url,
      },
      thumbnail: {
        key: thumbnail.key,
        uploadUrl: thumbnail.uploadUrl,
        url: thumbnail.url,
      },
    }
  }

  return { urls, error: null }
}

export async function uploadGalleryFileToR2(
  galleryId: string,
  photographerId: string,
  originalFileName: string,
  body: Buffer,
  contentType: string,
  isCompressed: boolean
): Promise<{ key: string; url: string; error: string | null }> {
  const safeGalleryId = sanitizeGalleryId(galleryId)
  if (!safeGalleryId) {
    return { key: '', url: '', error: 'מזהה גלריה לא תקין' }
  }

  const safePhotographerId = sanitizeGalleryId(photographerId)
  if (!safePhotographerId) {
    return { key: '', url: '', error: 'מזהה צלם לא תקין' }
  }

  const fileName = uniqueR2FileName(originalFileName)
  const key = buildGalleryObjectKey(
    safeGalleryId,
    fileName,
    isCompressed,
    safePhotographerId
  )
  const { error } = await putR2Object({ key, body, contentType })
  if (error) return { key: '', url: '', error }

  const url = r2PublicUrlFromKey(key)
  if (!r2PublicConfigured()) {
    return {
      key,
      url: '',
      error:
        'חסר NEXT_PUBLIC_R2_PUBLIC_URL (או R2_PUBLIC_URL) — לא ניתן ליצור קישור ציבורי',
    }
  }

  return { key, url, error: null }
}

export async function uploadCoverToR2(
  galleryId: string,
  photographerId: string,
  originalFileName: string,
  body: Buffer,
  contentType: string
): Promise<{ key: string; url: string; error: string | null }> {
  const safeGalleryId = sanitizeGalleryId(galleryId)
  if (!safeGalleryId) {
    return { key: '', url: '', error: 'מזהה גלריה לא תקין' }
  }

  const safePhotographerId = sanitizeGalleryId(photographerId)
  if (!safePhotographerId) {
    return { key: '', url: '', error: 'מזהה צלם לא תקין' }
  }

  const fileName = uniqueR2FileName(originalFileName)
  const key = buildCoverObjectKey(safeGalleryId, fileName, safePhotographerId)
  const { error } = await putR2Object({ key, body, contentType })
  if (error) return { key: '', url: '', error }

  const url = r2PublicUrlFromKey(key)
  if (!r2PublicConfigured()) {
    return {
      key,
      url: '',
      error:
        'חסר NEXT_PUBLIC_R2_PUBLIC_URL (או R2_PUBLIC_URL) — לא ניתן ליצור קישור ציבורי',
    }
  }

  return { key, url, error: null }
}

/** Presigned PUT לתמונת שער — העלאה ישירה מהדפדפן. */
export async function createCoverPresignedPutUrl(
  galleryId: string,
  photographerId: string,
  originalFileName: string,
  contentType: string
): Promise<{
  key: string
  uploadUrl: string
  url: string
  error: string | null
}> {
  const safeGalleryId = sanitizeGalleryId(galleryId)
  if (!safeGalleryId) {
    return { key: '', uploadUrl: '', url: '', error: 'מזהה גלריה לא תקין' }
  }

  const bucket = r2BucketName()
  if (!bucket) {
    return { key: '', uploadUrl: '', url: '', error: 'חסר R2_BUCKET_NAME ב-.env.local' }
  }

  const safePhotographerId = sanitizeGalleryId(photographerId)
  if (!safePhotographerId) {
    return { key: '', uploadUrl: '', url: '', error: 'מזהה צלם לא תקין' }
  }

  const fileName = uniqueR2FileName(originalFileName)
  const key = buildCoverObjectKey(safeGalleryId, fileName, safePhotographerId)
  if (!key) {
    return { key: '', uploadUrl: '', url: '', error: 'מזהה גלריה לא תקין' }
  }

  try {
    const client = getR2Client()
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      }),
      { expiresIn: GALLERY_PRESIGN_EXPIRES_SEC }
    )

    const url = r2PublicUrlFromKey(key)
    if (!r2PublicConfigured()) {
      return {
        key,
        uploadUrl: '',
        url: '',
        error:
          'חסר NEXT_PUBLIC_R2_PUBLIC_URL (או R2_PUBLIC_URL) — לא ניתן ליצור קישור ציבורי',
      }
    }

    return { key, uploadUrl, url, error: null }
  } catch (error) {
    return { key: '', uploadUrl: '', url: '', error: formatR2Error(error) }
  }
}

export async function deleteR2Objects(keys: string[]): Promise<void> {
  const bucket = r2BucketName()
  if (!bucket || !r2Configured() || keys.length === 0) return

  const uniqueKeys = [...new Set(keys.filter(Boolean))]
  const client = getR2Client()

  for (let i = 0; i < uniqueKeys.length; i += 1000) {
    const chunk = uniqueKeys.slice(i, i + 1000)
    await client
      .send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: chunk.map((Key) => ({ Key })) },
        })
      )
      .catch(() => {})
  }
}

export async function deleteR2ByUrls(urls: string[]): Promise<void> {
  const keys = urls
    .map((url) => r2KeyFromPublicUrl(url))
    .filter((key): key is string => !!key)
  await deleteR2Objects(keys)
}

export async function deleteR2GalleryFolder(
  galleryId: string,
  photographerId: string
): Promise<void> {
  const bucket = r2BucketName()
  if (!bucket || !r2Configured()) return

  const safeGalleryId = sanitizeGalleryId(galleryId)
  const safePhotographerId = sanitizeGalleryId(photographerId)
  if (!safeGalleryId || !safePhotographerId) return

  const client = getR2Client()
  const prefixes = [
    `photographers/${safePhotographerId}/galleries/${safeGalleryId}/`,
    `galleries/${safeGalleryId}/`,
  ]
  for (const prefix of prefixes) {
    let continuationToken: string | undefined

    do {
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      )

      const keys =
        list.Contents?.map((item) => item.Key).filter(
          (key): key is string => !!key
        ) ?? []

      if (keys.length > 0) await deleteR2Objects(keys)
      continuationToken = list.NextContinuationToken
    } while (continuationToken)
  }
}
