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
  readImageDimensions,
} from '@/lib/images/process'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

// ─── Types ───────────────────────────────────────────────────────────────────

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

type ActiveJob = {
  file: File
  photoId: string
  index: number
}

type UploadSuccess = {
  id: string
  originalPath: string
  previewPath: string
  watermarkedPath: string
  width: number | null
  height: number | null
}

type UploadFailure = {
  photoId: string
  paths: {
    originalPath?: string | null
    previewPath?: string | null
    watermarkedPath?: string | null
  }
  message: string
}

export type GalleryUploadCallbacks = {
  onPhotoStaged?: (photoId: string, file: File, previewUrl: string) => void
  onPhotoUploaded?: (photoId: string) => void
  onPhotoFailed?: (photoId: string) => void
  onPhaseChange?: (phase: GalleryUploadProgress['phase']) => void
  onComplete?: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const UPLOAD_CONCURRENCY = 3        // Back to original stable value
const RESERVATION_BATCH_SIZE = 100  
const URL_BATCH_SIZE = 100          
const COMPLETE_BATCH_SIZE = 100     
const PREFETCH_AHEAD = 2            // Re-enabled after testing            
const THUMB_MAX_MB = 0.18
const THUMB_MAX_DIMENSION = 1200
const THUMB_QUALITY = 0.78
const THUMB_MAX_ITERATION = 4
const PER_FILE_TIMEOUT_MS = 120_000
const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 1_000
const RETRY_MAX_DELAY_MS = 10_000

// ─── Tab visibility pause ────────────────────────────────────────────────────

let tabHiddenWaiters: Array<() => void> = []

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const wake = tabHiddenWaiters.splice(0)
      wake.forEach((resolve) => resolve())
    }
  })
}

function waitWhileTabHidden(): Promise<void> {
  if (typeof document === 'undefined' || !document.hidden) return Promise.resolve()
  return new Promise<void>((resolve) => { tabHiddenWaiters.push(resolve) })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(msg)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxRetries) break
      const delay = Math.min(RETRY_BASE_DELAY_MS * Math.pow(2, attempt), RETRY_MAX_DELAY_MS)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

export async function requestUploadWakeLock(): Promise<() => void> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return () => {}
  try {
    const sentinel = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<{ release: () => void }> } }).wakeLock.request('screen')
    return () => { void sentinel.release() }
  } catch {
    return () => {}
  }
}

export function formatGalleryUploadCount(n: number): string {
  return n.toLocaleString('he-IL')
}

// ─── Image processing ────────────────────────────────────────────────────────

async function compressGalleryPreview(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxSizeMB: THUMB_MAX_MB,
    maxWidthOrHeight: THUMB_MAX_DIMENSION,
    useWebWorker: false,
    fileType: 'image/jpeg',
    initialQuality: THUMB_QUALITY,
    maxIteration: THUMB_MAX_ITERATION,
  })
}

// ─── Single photo upload ─────────────────────────────────────────────────────

async function uploadReservedPhoto(
  userId: string,
  galleryId: string,
  job: ActiveJob,
  watermarkText: string | null | undefined,
  uploadUrls: string[]
): Promise<
  | {
      ok: true
      id: string
      originalPath: string
      previewPath: string
      watermarkedPath: string
      width: number | null
      height: number | null
    }
  | { ok: false; message: string; paths: ReturnType<typeof buildPhotoStoragePaths> }
> {
  const paths = buildPhotoStoragePaths(userId, galleryId, job.photoId)
  const originalContentType = job.file.type || 'image/jpeg'

  let width: number | null = null
  let height: number | null = null
  try {
    const dims = await readImageDimensions(job.file)
    width = dims.width
    height = dims.height
  } catch {
    // Dimensions are optional — homepage falls back to random selection.
  }

  let previewBlob: Blob
  try {
    previewBlob = await compressGalleryPreview(job.file)
  } catch {
    return { ok: false, message: `כיווץ נכשל: ${job.file.name}`, paths }
  }

  const resolvedWatermark = watermarkText?.trim() || 'Studio Gallery'
  const watermarkedBlob = await applyWatermarkToBlob(previewBlob, resolvedWatermark)

  const [originalUrl, previewUrl, watermarkedUrl] = uploadUrls
  if (!originalUrl || !previewUrl || !watermarkedUrl) {
    return { ok: false, message: `כתובות העלאה חסרות: ${job.file.name}`, paths }
  }

  // העלאה סדרתית יציבה — מונע חניקה של הרשת וביטולים של דפדפן/שרת סינון
  // העלאה סדרתית יציבה — ללא פרמטר שלישי שמכשיל קומפילציה
  try {
    await withRetry(() => putToPresignedUrl(originalUrl, job.file))
    await withRetry(() => putToPresignedUrl(previewUrl, previewBlob))
    await withRetry(() => putToPresignedUrl(watermarkedUrl, watermarkedBlob))
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : `העלאה נכשלה: ${job.file.name}`,
      paths,
    }
  }

  return {
    ok: true,
    id: job.photoId,
    originalPath: paths.originalPath,
    previewPath: paths.previewPath,
    watermarkedPath: paths.watermarkedPath,
    width,
    height,
  }
}

// ─── Batch pipeline ──────────────────────────────────────────────────────────

class BatchPipeline {
  private readonly userId: string
  private readonly galleryId: string
  private readonly files: File[]
  private readonly callbacks?: GalleryUploadCallbacks
  private readonly total: number
  public readonly isProcessed: boolean

  private reservedUpTo = 0
  private urlsFetchedUpTo = 0

  private reservationInFlight: Promise<void> | null = null
  private urlFetchInFlight: Map<number, Promise<void>> = new Map()

  readonly jobsMap = new Map<number, ActiveJob>()
  readonly urlMap = new Map<string, string[]>()

  constructor(
    userId: string,
    galleryId: string,
    files: File[],
    callbacks?: GalleryUploadCallbacks,
    isProcessed = false
  ) {
    this.userId = userId
    this.galleryId = galleryId
    this.files = files
    this.callbacks = callbacks
    this.total = files.length
    this.isProcessed = isProcessed
  }

  async ensureReserved(fileIndex: number): Promise<void> {
    while (fileIndex >= this.reservedUpTo) {
      if (!this.reservationInFlight) {
        this.reservationInFlight = this._doReserveBatch().finally(() => {
          this.reservationInFlight = null
        })
      }
      await this.reservationInFlight
    }
  }

  private async _doReserveBatch(): Promise<void> {
    const from = this.reservedUpTo
    if (from >= this.total) return
    const count = Math.min(RESERVATION_BATCH_SIZE, this.total - from)
    const reserved = await reservePhotosBatch(this.galleryId, count, this.isProcessed)

    for (let i = 0; i < count; i++) {
      const fileIndex = from + i
      const photoId = reserved[i]!.id
      const file = this.files[fileIndex]!
      this.jobsMap.set(fileIndex, { file, photoId, index: fileIndex })

      // Don't create blob URLs - they cause memory leaks and aren't used
      this.callbacks?.onPhotoStaged?.(photoId, file, '')
    }
    this.reservedUpTo = from + count
  }

  async ensureUrls(fileIndex: number): Promise<void> {
    console.log('👉 CLIENT 1. ensureUrls START', { fileIndex })
    await this.ensureReserved(fileIndex)
    console.log('👉 CLIENT 2. ensureReserved done')

    while (fileIndex >= this.urlsFetchedUpTo) {
      console.log('👉 CLIENT 3. In while loop', { fileIndex, urlsFetchedUpTo: this.urlsFetchedUpTo })
      const batchStart = this.urlsFetchedUpTo
      if (!this.urlFetchInFlight.has(batchStart)) {
        console.log('👉 CLIENT 4. Starting new URL fetch batch', { batchStart })
        const p = this._doFetchUrlsBatch(batchStart).finally(() => {
          console.log('👉 CLIENT 5. URL fetch batch finally', { batchStart })
          this.urlFetchInFlight.delete(batchStart)
        })
        this.urlFetchInFlight.set(batchStart, p)
      } else {
        console.log('👉 CLIENT 4b. URL fetch already in flight', { batchStart })
      }
      console.log('👉 CLIENT 6. About to await URL fetch', { batchStart })
      const existingPromise = this.urlFetchInFlight.get(batchStart)
      if (!existingPromise) {
        console.log('👉 CLIENT 6b. ERROR: Promise missing from map!', { batchStart })
        throw new Error(`URL fetch promise missing for batch ${batchStart}`)
      }
      await existingPromise
      console.log('👉 CLIENT 7. URL fetch await done', { batchStart })
    }
    console.log('👉 CLIENT 8. ensureUrls COMPLETE', { fileIndex })
  }

  private async _doFetchUrlsBatch(from: number): Promise<void> {
    console.log('👉 CLIENT 10. _doFetchUrlsBatch START', { from, total: this.total })
    if (from >= this.total) {
      console.log('👉 CLIENT 11. from >= total, returning early')
      return
    }
    console.log('👉 CLIENT 12. About to ensureReserved for URL batch')
    const count = Math.min(URL_BATCH_SIZE, this.total - from)
    await this.ensureReserved(from + count - 1)
    console.log('👉 CLIENT 13. ensureReserved done for URL batch')

    console.log('👉 CLIENT 14. Building requests', { count })
    const requests: { bucket: 'originals' | 'previews' | 'watermarked'; path: string; contentType: string }[] = []
    const jobs: ActiveJob[] = []

    for (let i = 0; i < count; i++) {
      const fileIndex = from + i
      const job = this.jobsMap.get(fileIndex)!
      jobs.push(job)
      const paths = buildPhotoStoragePaths(this.userId, this.galleryId, job.photoId)
      requests.push(
        { bucket: 'originals', path: paths.originalPath, contentType: job.file.type || 'image/jpeg' },
        { bucket: 'previews', path: paths.previewPath, contentType: 'image/jpeg' },
        { bucket: 'watermarked', path: paths.watermarkedPath, contentType: 'image/jpeg' }
      )
    }

    console.log('👉 CLIENT 15. About to call createR2UploadUrls', { requestCount: requests.length })
    const urls = await createR2UploadUrls(this.galleryId, requests)
    console.log('👉 CLIENT 16. createR2UploadUrls returned', { urlCount: urls.length })
    jobs.forEach((job, i) => {
      this.urlMap.set(job.photoId, [urls[i * 3]!, urls[i * 3 + 1]!, urls[i * 3 + 2]!])
    })

    this.urlsFetchedUpTo = from + count
    console.log('👉 CLIENT 17. _doFetchUrlsBatch COMPLETE', { urlsFetchedUpTo: this.urlsFetchedUpTo })
  }

  prefetchAhead(currentIndex: number): void {
    for (let ahead = 1; ahead <= PREFETCH_AHEAD; ahead++) {
      const nextBatchStart =
        Math.floor(currentIndex / URL_BATCH_SIZE) * URL_BATCH_SIZE + ahead * URL_BATCH_SIZE
      if (nextBatchStart < this.total) {
        void this.ensureUrls(nextBatchStart).catch(() => {})
      }
    }
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function uploadGalleryPhotosWithQueue(
  galleryId: string,
  userId: string,
  files: File[],
  watermarkText: string | null | undefined,
  onProgress: (progress: GalleryUploadProgress) => void,
  callbacks?: GalleryUploadCallbacks,
  isProcessed = false
): Promise<GalleryUploadResult> {
  console.log('👉 CLIENT 0. uploadGalleryPhotosWithQueue START', { galleryId, fileCount: files.length })
  const total = files.length
  if (total === 0) return { ok: false, uploaded: 0, message: 'לא נבחרו תמונות' }

  const releaseWakeLock = await requestUploadWakeLock()

  const pipeline = new BatchPipeline(userId, galleryId, files, callbacks, isProcessed)
  console.log('👉 CLIENT 0.5. BatchPipeline created')

  let nextFileIndex = 0
  let completed = 0
  let processed = 0

  // Atomic increment to prevent race conditions between workers
  function getNextIndex(): number {
    return nextFileIndex++
  }

  const successes: UploadSuccess[] = []
  const failures: UploadFailure[] = []

  function reportProgress(phase: GalleryUploadProgress['phase']) {
    callbacks?.onPhaseChange?.(phase)
    onProgress({
      completed,
      staged: Math.max(0, total - processed),
      total,
      phase,
      failed: failures.length > 0 ? failures.length : undefined,
    })
  }

  reportProgress('uploading')
  console.log('👉 CLIENT 0.6. Initial progress reported')

  try {
    async function worker() {
      console.log('👉 CLIENT 100. Worker START')
      for (;;) {
        console.log('👉 CLIENT 101. Worker loop iteration')
        const index = getNextIndex()
        console.log('👉 CLIENT 102. Got index', { index, total })
        if (index >= total) {
          console.log('👉 CLIENT 103. index >= total, worker returning')
          return
        }

        console.log('👉 CLIENT 104. About to call ensureUrls', { index })
        await pipeline.ensureUrls(index)
        console.log('👉 CLIENT 105. ensureUrls done', { index })
        // Temporarily disable prefetch to prevent race conditions
        // pipeline.prefetchAhead(index)

        await waitWhileTabHidden()

        const job = pipeline.jobsMap.get(index)!
        const urls = pipeline.urlMap.get(job.photoId)!

        try {
          const result = await withTimeout(
            uploadReservedPhoto(userId, galleryId, job, watermarkText, urls),
            PER_FILE_TIMEOUT_MS,
            `${job.file.name}: פג תוקף ההעלאה (${PER_FILE_TIMEOUT_MS / 1000} שניות)`
          )

          if (result.ok) {
            successes.push({
              id: result.id,
              originalPath: result.originalPath,
              previewPath: result.previewPath,
              watermarkedPath: result.watermarkedPath,
              width: result.width,
              height: result.height,
            })
            completed++
            callbacks?.onPhotoUploaded?.(job.photoId)
          } else {
            failures.push({
              photoId: job.photoId,
              paths: result.paths,
              message: result.message,
            })
            callbacks?.onPhotoFailed?.(job.photoId)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : `שגיאה בהעלאת ${job.file.name}`
          failures.push({
            photoId: job.photoId,
            paths: buildPhotoStoragePaths(userId, galleryId, job.photoId),
            message,
          })
          callbacks?.onPhotoFailed?.(job.photoId)
        } finally {
          pipeline.jobsMap.delete(index)
          pipeline.urlMap.delete(job.photoId)
        }

        processed += 1
        reportProgress('uploading')
      }
    }

    console.log('👉 CLIENT 200. About to start workers', { concurrency: Math.min(UPLOAD_CONCURRENCY, total) })
    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, total) }, () => worker())
    )
    console.log('👉 CLIENT 201. All workers done')

    if (successes.length > 0) {
      reportProgress('registering')
      for (let offset = 0; offset < successes.length; offset += COMPLETE_BATCH_SIZE) {
        const chunk = successes.slice(offset, offset + COMPLETE_BATCH_SIZE)
        await completePhotosBatch(galleryId, chunk, pipeline.isProcessed)
        onProgress({
          completed: Math.min(offset + chunk.length, successes.length),
          staged: 0,
          total,
          phase: 'registering',
          failed: failures.length > 0 ? failures.length : undefined,
        })
      }
      await finalizeGalleryUpload(galleryId)
    }

    if (failures.length > 0) {
      await cleanupPhotosBatch(
        galleryId,
        failures.map((f) => f.photoId),
        failures.map((f) => f.paths)
      )
    }
  } finally {
    releaseWakeLock()
  }

  const failCount = failures.length
  if (failCount === 0) {
    callbacks?.onComplete?.()
    return { ok: true, uploaded: completed }
  }

  const errors = failures.map((f) => f.message)
  const shown = errors.slice(0, 3).join(' · ')
  const more = failCount > 3 ? ` (ועוד ${formatGalleryUploadCount(failCount - 3)} שגיאות)` : ''
  const partialHint = completed > 0
    ? ' התמונות שהצליחו נשמרו. אפשר לבחור שוב רק את הנותרות.'
    : ''

  if (completed > 0) callbacks?.onComplete?.()

  return {
    ok: false,
    uploaded: completed,
    message: completed > 0
      ? `הועלו ${formatGalleryUploadCount(completed)} מתוך ${formatGalleryUploadCount(total)}. ${shown}${more}.${partialHint}`
      : `${shown}${more}`,
  }
}