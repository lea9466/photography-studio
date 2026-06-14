'use client'

import imageCompression from 'browser-image-compression'
import { createR2UploadUrls } from '@/lib/actions/storage.actions'
import {
  cleanupPhotosBatch,
  completePhotosBatch,
  finalizeGalleryUpload,
  reservePhotosBatch,
} from '@/lib/actions/photo.actions'
import {
  applyWatermarkToBlob,
  buildPhotoStoragePaths,
} from '@/lib/images/process'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

export type GalleryUploadProgress = {
  completed: number
  staged: number
  total: number
  phase: 'preparing' | 'uploading' | 'registering'
  failed?: number
}

export type GalleryUploadResult = {
  ok: boolean
  uploaded: number
  message?: string
}

type UploadJob = {
  file: File
  photoId: string
}

const UPLOAD_CONCURRENCY = 6
const RESERVE_BATCH_SIZE = 50
const COMPLETE_BATCH_SIZE = 50
const THUMB_MAX_MB = 0.18
const THUMB_MAX_DIMENSION = 1200
const THUMB_QUALITY = 0.78
const THUMB_MAX_ITERATION = 4
const PER_FILE_TIMEOUT_MS = 120_000

let tabHiddenWaiters: Array<() => void> = []

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const wake = tabHiddenWaiters
      tabHiddenWaiters = []
      wake.forEach((resolve) => resolve())
    }
  })
}

function waitWhileTabHidden() {
  if (typeof document === 'undefined' || !document.hidden) {
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    tabHiddenWaiters.push(resolve)
  })
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function requestUploadWakeLock() {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return () => {}
  }
  try {
    const sentinel = await navigator.wakeLock.request('screen')
    return () => {
      void sentinel.release()
    }
  } catch {
    return () => {}
  }
}

export function formatGalleryUploadCount(n: number) {
  return n.toLocaleString('he-IL')
}

async function compressGalleryPreview(file: File) {
  return imageCompression(file, {
    maxSizeMB: THUMB_MAX_MB,
    maxWidthOrHeight: THUMB_MAX_DIMENSION,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: THUMB_QUALITY,
    maxIteration: THUMB_MAX_ITERATION,
  })
}

async function uploadReservedPhoto(
  userId: string,
  galleryId: string,
  job: UploadJob,
  watermarkText?: string | null
) {
  const paths = buildPhotoStoragePaths(userId, galleryId, job.photoId)
  const originalContentType = job.file.type || 'image/jpeg'

  let previewBlob: Blob
  try {
    previewBlob = await compressGalleryPreview(job.file)
  } catch {
    return {
      ok: false as const,
      message: `כיווץ נכשל: ${job.file.name}`,
      paths,
    }
  }

  const watermarkedBlob = await applyWatermarkToBlob(
    previewBlob,
    watermarkText ?? undefined
  )

  let uploadUrls: string[]
  try {
    uploadUrls = await createR2UploadUrls(galleryId, [
      {
        bucket: 'originals',
        path: paths.originalPath,
        contentType: originalContentType,
      },
      {
        bucket: 'previews',
        path: paths.previewPath,
        contentType: 'image/jpeg',
      },
      {
        bucket: 'watermarked',
        path: paths.watermarkedPath,
        contentType: 'image/jpeg',
      },
    ])
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : `הכנת העלאה נכשלה: ${job.file.name}`,
      paths,
    }
  }

  const [originalUrl, previewUrl, watermarkedUrl] = uploadUrls
  if (!originalUrl || !previewUrl || !watermarkedUrl) {
    return {
      ok: false as const,
      message: `כתובות העלאה חסרות: ${job.file.name}`,
      paths,
    }
  }

  try {
    await Promise.all([
      putToPresignedUrl(originalUrl, job.file),
      putToPresignedUrl(previewUrl, previewBlob),
      putToPresignedUrl(watermarkedUrl, watermarkedBlob),
    ])
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : `העלאה נכשלה: ${job.file.name}`,
      paths,
    }
  }

  return {
    ok: true as const,
    id: job.photoId,
    originalPath: paths.originalPath,
    previewPath: paths.previewPath,
    watermarkedPath: paths.watermarkedPath,
    paths,
  }
}

async function reserveAllUploadJobs(galleryId: string, files: File[]) {
  const jobs: UploadJob[] = []

  for (let offset = 0; offset < files.length; offset += RESERVE_BATCH_SIZE) {
    const chunk = files.slice(offset, offset + RESERVE_BATCH_SIZE)
    const reserved = await reservePhotosBatch(galleryId, chunk.length)

    if (reserved.length !== chunk.length) {
      await cleanupPhotosBatch(
        galleryId,
        jobs.map((job) => job.photoId),
        []
      )
      return {
        ok: false as const,
        message: 'מספר השורות השמורות לא תואם לקבצים',
      }
    }

    chunk.forEach((file, index) => {
      jobs.push({
        file,
        photoId: reserved[index]!.id,
      })
    })
  }

  return { ok: true as const, jobs }
}

export type GalleryUploadCallbacks = {
  onJobsReady?: (jobs: { photoId: string; file: File }[]) => void
  onPhotoUploaded?: (photoId: string) => void
  onPhotoFailed?: (photoId: string) => void
  onPhaseChange?: (phase: GalleryUploadProgress['phase']) => void
  onComplete?: () => void
}

export async function uploadGalleryPhotosWithQueue(
  galleryId: string,
  userId: string,
  files: File[],
  watermarkText: string | null | undefined,
  onProgress: (progress: GalleryUploadProgress) => void,
  callbacks?: GalleryUploadCallbacks
): Promise<GalleryUploadResult> {
  const total = files.length
  if (total === 0) {
    return { ok: false, uploaded: 0, message: 'לא נבחרו תמונות' }
  }

  const releaseWakeLock = await requestUploadWakeLock()
  let nextIndex = 0
  let completed = 0
  let processed = 0
  const uploadErrors: string[] = []
  const failedJobs: UploadJob[] = []
  const failedPaths: {
    originalPath?: string | null
    previewPath?: string | null
    watermarkedPath?: string | null
  }[] = []
  const successfulUploads: {
    id: string
    originalPath: string
    previewPath: string
    watermarkedPath: string
  }[] = []

  onProgress({ completed: 0, staged: total, total, phase: 'preparing' })

  const reserved = await reserveAllUploadJobs(galleryId, files)
  if (!reserved.ok) {
    releaseWakeLock()
    return { ok: false, uploaded: 0, message: reserved.message }
  }

  const jobs = reserved.jobs
  callbacks?.onJobsReady?.(
    jobs.map((job) => ({ photoId: job.photoId, file: job.file }))
  )

  function reportProgress(phase: GalleryUploadProgress['phase']) {
    callbacks?.onPhaseChange?.(phase)
    onProgress({
      completed,
      staged: Math.max(0, total - processed),
      total,
      phase,
      failed: uploadErrors.length > 0 ? uploadErrors.length : undefined,
    })
  }

  reportProgress('uploading')

  try {
    async function worker() {
      for (;;) {
        const index = nextIndex
        nextIndex += 1
        if (index >= jobs.length) return

        await waitWhileTabHidden()
        const job = jobs[index]!

        try {
          const result = await withTimeout(
            uploadReservedPhoto(userId, galleryId, job, watermarkText),
            PER_FILE_TIMEOUT_MS,
            `${job.file.name}: פג תוקף ההעלאה (${PER_FILE_TIMEOUT_MS / 1000} שניות)`
          )

          if (result.ok) {
            successfulUploads.push({
              id: result.id,
              originalPath: result.originalPath,
              previewPath: result.previewPath,
              watermarkedPath: result.watermarkedPath,
            })
            completed += 1
            callbacks?.onPhotoUploaded?.(job.photoId)
          } else {
            uploadErrors.push(result.message)
            failedJobs.push(job)
            callbacks?.onPhotoFailed?.(job.photoId)
            failedPaths.push({
              originalPath: result.paths.originalPath,
              previewPath: result.paths.previewPath,
              watermarkedPath: result.paths.watermarkedPath,
            })
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : `שגיאה בהעלאת ${job.file.name}`
          uploadErrors.push(message)
          failedJobs.push(job)
          callbacks?.onPhotoFailed?.(job.photoId)
          failedPaths.push(buildPhotoStoragePaths(userId, galleryId, job.photoId))
        }

        processed += 1
        reportProgress('uploading')
      }
    }

    const workers = Array.from(
      { length: Math.min(UPLOAD_CONCURRENCY, jobs.length) },
      () => worker()
    )
    await Promise.all(workers)

    if (successfulUploads.length > 0) {
      reportProgress('registering')
      for (
        let offset = 0;
        offset < successfulUploads.length;
        offset += COMPLETE_BATCH_SIZE
      ) {
        const chunk = successfulUploads.slice(offset, offset + COMPLETE_BATCH_SIZE)
        await completePhotosBatch(galleryId, chunk)
        onProgress({
          completed: Math.min(offset + chunk.length, successfulUploads.length),
          staged: 0,
          total,
          phase: 'registering',
          failed: uploadErrors.length > 0 ? uploadErrors.length : undefined,
        })
      }
      await finalizeGalleryUpload(galleryId)
    }

    if (failedJobs.length > 0) {
      await cleanupPhotosBatch(
        galleryId,
        failedJobs.map((job) => job.photoId),
        failedPaths
      )
    }
  } finally {
    releaseWakeLock()
  }

  const failCount = uploadErrors.length
  if (failCount === 0) {
    return { ok: true, uploaded: completed }
  }

  const shown = uploadErrors.slice(0, 3).join(' · ')
  const more =
    failCount > 3
      ? ` (ועוד ${formatGalleryUploadCount(failCount - 3)} שגיאות)`
      : ''
  const partialHint =
    completed > 0
      ? ' התמונות שהצליחו נשמרו. אפשר לבחור שוב רק את הנותרות.'
      : ''

  return {
    ok: false,
    uploaded: completed,
    message:
      completed > 0
        ? `הועלו ${formatGalleryUploadCount(completed)} מתוך ${formatGalleryUploadCount(total)}. ${shown}${more}.${partialHint}`
        : `${shown}${more}`,
  }
}
