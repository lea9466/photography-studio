'use client'

import { createR2UploadUrls } from '@/lib/actions/storage.actions'
import {
  cleanupPhotosBatch,
  completePhotosBatch,
  finalizeGalleryUpload,
  reservePhotosBatch,
} from '@/lib/actions/photo.actions'
import {
  buildPhotoStoragePaths,
  type WatermarkPlacement,
} from '@/lib/images/process'
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
  applyAutoWatermark = true,
  /** Per-account override, computed server-side — see isMvpBypassUser / DOWNLOAD_PERMISSIONS_ENABLED. */
  storeOriginals = false,
  /**
   * Client selection galleries pass `center` — a large, faint mark the client
   * can't crop out. Showcase/public galleries keep the `corner` stamp.
   */
  watermarkPlacement: WatermarkPlacement = 'corner'
): Promise<GalleryUploadResult> {
  return uploadMediaPhotosWithQueue(
    {
      entityId: galleryId,
      userId,
      isProcessed,
      displayOnly: !storeOriginals,
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
    applyAutoWatermark,
    watermarkPlacement
  )
}
