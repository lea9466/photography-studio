'use client'

import imageCompression from 'browser-image-compression'
import { PREVIEW_COMPRESSION_OPTIONS } from '@/lib/images/preview-compression'
import type { R2UploadRequest } from '@/lib/r2/types'
import {
  applyWatermarkToBlob,
  readImageDimensions,
} from '@/lib/images/process'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

export type MediaUploadProgress = {
  completed: number
  staged: number
  total: number
  phase: 'preparing' | 'uploading' | 'registering'
  failed?: number
}

export type MediaUploadResult = {
  ok: boolean
  uploaded: number
  message?: string
}

export type PhotoStoragePaths = {
  originalPath: string
  previewPath: string
  watermarkedPath: string
}

export type MediaUploadCallbacks = {
  onPhotoStaged?: (photoId: string, file: File, previewUrl: string) => void
  onPhotoUploaded?: (photoId: string) => void
  onPhotoFailed?: (photoId: string) => void
  onPhaseChange?: (phase: MediaUploadProgress['phase']) => void
  onComplete?: () => void
}

export type MediaUploadDeps = {
  entityId: string
  userId: string
  isProcessed?: boolean
  /** When true, skip originals bucket — preview + watermarked only (gallery display mode). */
  displayOnly?: boolean
  buildPaths: (userId: string, entityId: string, photoId: string) => PhotoStoragePaths
  reserveBatch: (
    entityId: string,
    count: number,
    isProcessed?: boolean
  ) => Promise<{ id: string }[]>
  completeBatch: (
    entityId: string,
    items: {
      id: string
      originalPath?: string | null
      previewPath: string
      watermarkedPath: string
      width?: number | null
      height?: number | null
    }[],
    isProcessed?: boolean
  ) => Promise<void>
  cleanupBatch: (entityId: string, photoIds: string[]) => Promise<void>
  finalize: (entityId: string) => Promise<void>
  createUploadUrls: (entityId: string, requests: R2UploadRequest[]) => Promise<string[]>
}

type ActiveJob = {
  file: File
  photoId: string
  index: number
}

type UploadSuccess = {
  id: string
  originalPath: string | null
  previewPath: string
  watermarkedPath: string
  width: number | null
  height: number | null
}

type CleanupStoragePaths = {
  originalPath?: string | null
  previewPath?: string | null
  watermarkedPath?: string | null
}

type UploadFailure = {
  photoId: string
  paths: CleanupStoragePaths
  message: string
}

const UPLOAD_CONCURRENCY = 3
const RESERVATION_BATCH_SIZE = 100
const URL_BATCH_SIZE = 100
const COMPLETE_BATCH_SIZE = 100
const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 1_000
const RETRY_MAX_DELAY_MS = 10_000

/**
 * A flat 2-minute timeout was too short for a large original on a slow
 * connection — the whole photo (compress + watermark + all its uploads)
 * would get killed mid-transfer and reported as a failure, which is exactly
 * the "breaks partway through" symptom. Scale the budget with the original
 * file's size instead: a floor for small files, plus an allowance generous
 * enough to survive a genuinely slow (~2 Mbps) upload, not just a fast one.
 */
const BASE_TIMEOUT_MS = 60_000
const TIMEOUT_MS_PER_MB = 4_000

function timeoutForFile(file: File): number {
  const sizeMb = file.size / (1024 * 1024)
  return BASE_TIMEOUT_MS + sizeMb * TIMEOUT_MS_PER_MB
}

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
    const sentinel = await (
      navigator as Navigator & {
        wakeLock: { request: (type: string) => Promise<{ release: () => void }> }
      }
    ).wakeLock.request('screen')
    return () => {
      void sentinel.release()
    }
  } catch {
    return () => {}
  }
}

export function formatMediaUploadCount(n: number): string {
  return n.toLocaleString('he-IL')
}

async function compressGalleryPreview(file: File): Promise<Blob> {
  return imageCompression(file, PREVIEW_COMPRESSION_OPTIONS)
}

async function uploadReservedPhoto(
  deps: MediaUploadDeps,
  job: ActiveJob,
  watermarkText: string | null | undefined,
  applyAutoWatermark: boolean,
  uploadUrls: string[]
): Promise<
  | {
      ok: true
      id: string
      originalPath: string | null
      previewPath: string
      watermarkedPath: string
      width: number | null
      height: number | null
    }
  | { ok: false; message: string; paths: PhotoStoragePaths }
> {
  const paths = deps.buildPaths(deps.userId, deps.entityId, job.photoId)
  const displayOnly = deps.displayOnly ?? false

  let width: number | null = null
  let height: number | null = null
  try {
    const dims = await readImageDimensions(job.file)
    width = dims.width
    height = dims.height
  } catch {
    // Dimensions are optional.
  }

  let previewBlob: Blob
  try {
    previewBlob = await compressGalleryPreview(job.file)
  } catch {
    return { ok: false, message: `כיווץ נכשל: ${job.file.name}`, paths }
  }

  const resolvedWatermark = watermarkText?.trim() || 'Studio Gallery'
  const watermarkedBlob = await applyWatermarkToBlob(
    previewBlob,
    resolvedWatermark,
    applyAutoWatermark
  )

  if (displayOnly) {
    const [previewUrl, watermarkedUrl] = uploadUrls
    if (!previewUrl || !watermarkedUrl) {
      return { ok: false, message: `כתובות העלאה חסרות: ${job.file.name}`, paths }
    }

    try {
      // Independent uploads — run together instead of one-after-another so
      // concurrency actually buys parallel network transfers, not just
      // parallel photos.
      await Promise.all([
        withRetry(() => putToPresignedUrl(previewUrl, previewBlob)),
        withRetry(() => putToPresignedUrl(watermarkedUrl, watermarkedBlob)),
      ])
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
      originalPath: null,
      previewPath: paths.previewPath,
      watermarkedPath: paths.watermarkedPath,
      width,
      height,
    }
  }

  const [originalUrl, previewUrl, watermarkedUrl] = uploadUrls
  if (!originalUrl || !previewUrl || !watermarkedUrl) {
    return { ok: false, message: `כתובות העלאה חסרות: ${job.file.name}`, paths }
  }

  try {
    // Independent uploads — run together instead of one-after-another so
    // concurrency actually buys parallel network transfers, not just
    // parallel photos.
    await Promise.all([
      withRetry(() => putToPresignedUrl(originalUrl, job.file)),
      withRetry(() => putToPresignedUrl(previewUrl, previewBlob)),
      withRetry(() => putToPresignedUrl(watermarkedUrl, watermarkedBlob)),
    ])
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

class BatchPipeline {
  private readonly deps: MediaUploadDeps
  private readonly files: File[]
  private readonly callbacks?: MediaUploadCallbacks
  private readonly total: number
  public readonly isProcessed: boolean

  private reservedUpTo = 0
  private urlsFetchedUpTo = 0

  private reservationInFlight: Promise<void> | null = null
  private urlFetchInFlight: Map<number, Promise<void>> = new Map()

  readonly jobsMap = new Map<number, ActiveJob>()
  readonly urlMap = new Map<string, string[]>()

  constructor(
    deps: MediaUploadDeps,
    files: File[],
    callbacks?: MediaUploadCallbacks
  ) {
    this.deps = deps
    this.files = files
    this.callbacks = callbacks
    this.total = files.length
    this.isProcessed = deps.isProcessed ?? false
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
    const reserved = await this.deps.reserveBatch(
      this.deps.entityId,
      count,
      this.isProcessed
    )

    for (let i = 0; i < count; i++) {
      const fileIndex = from + i
      const photoId = reserved[i]!.id
      const file = this.files[fileIndex]!
      this.jobsMap.set(fileIndex, { file, photoId, index: fileIndex })
      this.callbacks?.onPhotoStaged?.(photoId, file, '')
    }
    this.reservedUpTo = from + count
  }

  async ensureUrls(fileIndex: number): Promise<void> {
    await this.ensureReserved(fileIndex)

    while (fileIndex >= this.urlsFetchedUpTo) {
      const batchStart = this.urlsFetchedUpTo
      if (!this.urlFetchInFlight.has(batchStart)) {
        const promise = this._doFetchUrlsBatch(batchStart).finally(() => {
          this.urlFetchInFlight.delete(batchStart)
        })
        this.urlFetchInFlight.set(batchStart, promise)
      }
      const existingPromise = this.urlFetchInFlight.get(batchStart)
      if (!existingPromise) {
        throw new Error(`URL fetch promise missing for batch ${batchStart}`)
      }
      await existingPromise
    }
  }

  private async _doFetchUrlsBatch(from: number): Promise<void> {
    if (from >= this.total) return
    const count = Math.min(URL_BATCH_SIZE, this.total - from)
    await this.ensureReserved(from + count - 1)

    const displayOnly = this.deps.displayOnly ?? false
    const requests: R2UploadRequest[] = []
    const jobs: ActiveJob[] = []

    for (let i = 0; i < count; i++) {
      const fileIndex = from + i
      const job = this.jobsMap.get(fileIndex)!
      jobs.push(job)
      const paths = this.deps.buildPaths(this.deps.userId, this.deps.entityId, job.photoId)

      if (displayOnly) {
        requests.push(
          { bucket: 'previews', path: paths.previewPath, contentType: 'image/jpeg' },
          { bucket: 'watermarked', path: paths.watermarkedPath, contentType: 'image/jpeg' }
        )
      } else {
        requests.push(
          {
            bucket: 'originals',
            path: paths.originalPath,
            contentType: job.file.type || 'image/jpeg',
            fileSize: job.file.size,
          },
          { bucket: 'previews', path: paths.previewPath, contentType: 'image/jpeg' },
          { bucket: 'watermarked', path: paths.watermarkedPath, contentType: 'image/jpeg' }
        )
      }
    }

    const urls = await this.deps.createUploadUrls(this.deps.entityId, requests)
    const urlsPerPhoto = displayOnly ? 2 : 3
    jobs.forEach((job, i) => {
      const base = i * urlsPerPhoto
      if (displayOnly) {
        this.urlMap.set(job.photoId, [urls[base]!, urls[base + 1]!])
      } else {
        this.urlMap.set(job.photoId, [urls[base]!, urls[base + 1]!, urls[base + 2]!])
      }
    })

    this.urlsFetchedUpTo = from + count
  }
}

export async function uploadMediaPhotosWithQueue(
  deps: MediaUploadDeps,
  files: File[],
  watermarkText: string | null | undefined,
  onProgress: (progress: MediaUploadProgress) => void,
  callbacks?: MediaUploadCallbacks,
  applyAutoWatermark = true
): Promise<MediaUploadResult> {
  const total = files.length
  if (total === 0) return { ok: false, uploaded: 0, message: 'לא נבחרו תמונות' }

  const releaseWakeLock = await requestUploadWakeLock()
  const pipeline = new BatchPipeline(deps, files, callbacks)

  let nextFileIndex = 0
  let completed = 0
  let processed = 0

  function getNextIndex(): number {
    return nextFileIndex++
  }

  const successes: UploadSuccess[] = []
  const failures: UploadFailure[] = []

  function reportProgress(phase: MediaUploadProgress['phase']) {
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

  let fatalError: Error | null = null

  try {
    async function worker() {
      for (;;) {
        const index = getNextIndex()
        if (index >= total) return

        await pipeline.ensureUrls(index)

        const job = pipeline.jobsMap.get(index)!
        const urls = pipeline.urlMap.get(job.photoId)!

        try {
          const timeoutMs = timeoutForFile(job.file)
          const result = await withTimeout(
            uploadReservedPhoto(deps, job, watermarkText, applyAutoWatermark, urls),
            timeoutMs,
            `${job.file.name}: פג תוקף ההעלאה (${Math.round(timeoutMs / 1000)} שניות)`
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
          const fullPaths = deps.buildPaths(deps.userId, deps.entityId, job.photoId)
          failures.push({
            photoId: job.photoId,
            paths: deps.displayOnly
              ? {
                  previewPath: fullPaths.previewPath,
                  watermarkedPath: fullPaths.watermarkedPath,
                }
              : fullPaths,
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

    try {
      await Promise.all(
        Array.from({ length: Math.min(UPLOAD_CONCURRENCY, total) }, () => worker())
      )
    } catch (error) {
      // A setup-level failure (e.g. the gallery's photo-count limit was hit
      // reserving the next batch) previously escaped as an unhandled
      // rejection instead of the structured { ok, message } result every
      // other failure path returns — the caller's catch block then showed a
      // generic "upload failed" toast instead of the actual reason.
      fatalError = error instanceof Error ? error : new Error('שגיאה בהעלאת תמונות')
    }

    if (successes.length > 0) {
      reportProgress('registering')
      for (let offset = 0; offset < successes.length; offset += COMPLETE_BATCH_SIZE) {
        const chunk = successes.slice(offset, offset + COMPLETE_BATCH_SIZE)
        await deps.completeBatch(deps.entityId, chunk, pipeline.isProcessed)
        onProgress({
          completed: Math.min(offset + chunk.length, successes.length),
          staged: 0,
          total,
          phase: 'registering',
          failed: failures.length > 0 ? failures.length : undefined,
        })
      }
      await deps.finalize(deps.entityId)
    }

    if (failures.length > 0) {
      await deps.cleanupBatch(
        deps.entityId,
        failures.map((f) => f.photoId)
      )
    }
  } finally {
    releaseWakeLock()
  }

  if (fatalError) {
    if (completed > 0) callbacks?.onComplete?.()
    return {
      ok: false,
      uploaded: completed,
      message:
        completed > 0
          ? `הועלו ${formatMediaUploadCount(completed)} מתוך ${formatMediaUploadCount(total)}. ${fatalError.message}`
          : fatalError.message,
    }
  }

  const failCount = failures.length
  if (failCount === 0) {
    callbacks?.onComplete?.()
    return { ok: true, uploaded: completed }
  }

  const errors = failures.map((f) => f.message)
  const shown = errors.slice(0, 3).join(' · ')
  const more = failCount > 3 ? ` (ועוד ${formatMediaUploadCount(failCount - 3)} שגיאות)` : ''
  const partialHint =
    completed > 0 ? ' התמונות שהצליחו נשמרו. אפשר לבחור שוב רק את הנותרות.' : ''

  if (completed > 0) callbacks?.onComplete?.()

  return {
    ok: false,
    uploaded: completed,
    message:
      completed > 0
        ? `הועלו ${formatMediaUploadCount(completed)} מתוך ${formatMediaUploadCount(total)}. ${shown}${more}.${partialHint}`
        : `${shown}${more}`,
  }
}
