'use client'

import { createPostR2UploadUrls } from '@/lib/actions/storage.actions'
import {
  cleanupPostPhotosBatch,
  completePostPhotosBatch,
  finalizePostUpload,
  reservePostPhotosBatch,
} from '@/lib/actions/post-photo.actions'
import { buildPostPhotoStoragePaths } from '@/lib/images/process'
import {
  formatMediaUploadCount,
  uploadMediaPhotosWithQueue,
  type MediaUploadCallbacks,
  type MediaUploadProgress,
  type MediaUploadResult,
} from '@/lib/media-upload-pipeline'

export type PostUploadProgress = MediaUploadProgress
export type PostUploadResult = MediaUploadResult
export type PostUploadCallbacks = MediaUploadCallbacks

export function formatPostUploadCount(n: number): string {
  return formatMediaUploadCount(n)
}

export async function uploadPostPhotosWithQueue(
  postId: string,
  userId: string,
  files: File[],
  watermarkText: string | null | undefined,
  onProgress: (progress: PostUploadProgress) => void,
  callbacks?: PostUploadCallbacks,
  applyAutoWatermark = true
): Promise<PostUploadResult> {
  return uploadMediaPhotosWithQueue(
    {
      entityId: postId,
      userId,
      displayOnly: true,
      buildPaths: buildPostPhotoStoragePaths,
      reserveBatch: (entityId, count) => reservePostPhotosBatch(entityId, count),
      completeBatch: (entityId, items) => completePostPhotosBatch(entityId, items),
      cleanupBatch: cleanupPostPhotosBatch,
      finalize: finalizePostUpload,
      createUploadUrls: createPostR2UploadUrls,
    },
    files,
    watermarkText,
    onProgress,
    callbacks,
    applyAutoWatermark
  )
}
