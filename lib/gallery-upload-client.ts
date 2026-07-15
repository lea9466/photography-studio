'use client'

import { createR2UploadUrls } from '@/lib/actions/storage.actions'
import {
  cleanupPhotosBatch,
  completePhotosBatch,
  finalizeGalleryUpload,
  reservePhotosBatch,
} from '@/lib/actions/photo.actions'
import { buildPhotoStoragePaths } from '@/lib/images/process'
import {
  formatMediaUploadCount,
  uploadMediaPhotosWithQueue,
  type MediaUploadCallbacks,
  type MediaUploadProgress,
  type MediaUploadResult,
} from '@/lib/media-upload-pipeline'

export type GalleryUploadProgress = MediaUploadProgress
export type GalleryUploadResult = MediaUploadResult
export type GalleryUploadCallbacks = MediaUploadCallbacks

export { requestUploadWakeLock } from '@/lib/media-upload-pipeline'

export function formatGalleryUploadCount(n: number): string {
  return formatMediaUploadCount(n)
}

export async function uploadGalleryPhotosWithQueue(
  galleryId: string,
  userId: string,
  files: File[],
  watermarkText: string | null | undefined,
  onProgress: (progress: GalleryUploadProgress) => void,
  callbacks?: GalleryUploadCallbacks,
  isProcessed = false,
  applyAutoWatermark = true
): Promise<GalleryUploadResult> {
  return uploadMediaPhotosWithQueue(
    {
      entityId: galleryId,
      userId,
      isProcessed,
      displayOnly: true,
      buildPaths: buildPhotoStoragePaths,
      reserveBatch: reservePhotosBatch,
      completeBatch: completePhotosBatch,
      cleanupBatch: cleanupPhotosBatch,
      finalize: finalizeGalleryUpload,
      createUploadUrls: createR2UploadUrls,
    },
    files,
    watermarkText,
    onProgress,
    callbacks,
    applyAutoWatermark
  )
}
