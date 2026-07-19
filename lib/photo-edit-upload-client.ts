'use client'

import imageCompression from 'browser-image-compression'
import { preparePhotoEditImageUpload } from '@/lib/actions/photo-edit-comparisons.actions'
import { applyWatermarkToBlob } from '@/lib/images/process'
import { PREVIEW_COMPRESSION_OPTIONS } from '@/lib/images/preview-compression'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

export type PhotoEditUploadResult = {
  previewPath: string
  watermarkedPath: string
  localPreviewUrl: string
}

/**
 * Same display-only pipeline as galleries/posts:
 * compress to ~1200px JPEG, optional watermark, upload previews + watermarked only.
 */
export async function uploadPhotoEditDisplayImage(input: {
  comparisonId: string
  role: 'original' | 'edited'
  file: File
  watermarkText: string
  applyAutoWatermark: boolean
}): Promise<PhotoEditUploadResult> {
  let previewBlob: Blob
  try {
    previewBlob = await imageCompression(input.file, PREVIEW_COMPRESSION_OPTIONS)
  } catch {
    throw new Error('כיווץ התמונה נכשל')
  }

  const watermarkedBlob = await applyWatermarkToBlob(
    previewBlob,
    input.watermarkText,
    input.applyAutoWatermark
  )

  const prepared = await preparePhotoEditImageUpload({
    comparisonId: input.comparisonId,
    role: input.role,
    contentType: 'image/jpeg',
    fileSize: Math.max(previewBlob.size, watermarkedBlob.size),
  })

  if (!prepared.success || !prepared.data) {
    throw new Error(prepared.success === false ? prepared.error : 'ההעלאה נכשלה')
  }

  await putToPresignedUrl(prepared.data.previewUploadUrl, previewBlob)
  await putToPresignedUrl(prepared.data.watermarkedUploadUrl, watermarkedBlob)

  return {
    previewPath: prepared.data.previewPath,
    watermarkedPath: prepared.data.watermarkedPath,
    localPreviewUrl: URL.createObjectURL(previewBlob),
  }
}
