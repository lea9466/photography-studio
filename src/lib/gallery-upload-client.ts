'use client'

import {
  compressGalleryThumbnail,
  terminateThumbnailCompressPool,
  THUMB_COMPRESS_CONCURRENCY,
} from '@/lib/gallery-thumbnail-compress'

/** העלאות מקבילות ל-R2 (כל תמונה = מקור + ממוזער = 2 PUT) */
export const UPLOAD_CONCURRENCY = 5
export const RECOMMENDED_UPLOAD_BATCH = 500
/** מעל הכמות הזו ההעלאה מפוצלת אוטומטית למנות-על — שומר פרופיל זיכרון נמוך */
export const SUPER_BATCH_SIZE = 500
const SUPER_BATCH_COOLDOWN_MS = 750
export const MAX_BULK_DOWNLOAD = 200
const RESERVE_BATCH_SIZE = 50
const PRESIGN_BATCH_SIZE = 50
const CLEANUP_BATCH_SIZE = 80
const READY_BATCH_SIZE = 50
const BATCH_COOLDOWN_MS = 0
const MULTIPART_MIN_SIZE = 100 * 1024 * 1024
const MULTIPART_CHUNK_SIZE = 20 * 1024 * 1024
const MULTIPART_PART_MAX_ATTEMPTS = 3
const MULTIPART_PART_RETRY_BASE_MS = 2000
const PER_FILE_TIMEOUT_MS = 120_000
const FETCH_MAX_ATTEMPTS = 3
const FETCH_RETRY_BASE_MS = 600

const bulkUploadHeaders = { 'X-Skip-Revalidate': '1' } as const

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('aborted') ||
    msg.includes('suspended') ||
    msg.includes('load failed')
  )
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let lastError: unknown
  let lastResponse: Response | null = null

  for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt += 1) {
    await waitWhileTabHidden()
    try {
      const response = await fetch(input, init)
      if (!isRetryableHttpStatus(response.status) || attempt === FETCH_MAX_ATTEMPTS) {
        return response
      }
      lastResponse = response
    } catch (error) {
      lastError = error
      if (!isRetryableFetchError(error) || attempt === FETCH_MAX_ATTEMPTS) {
        throw error
      }
    }
    await sleep(FETCH_RETRY_BASE_MS * 2 ** (attempt - 1))
  }

  if (lastResponse) return lastResponse
  throw lastError
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

function waitWhileTabHidden(): Promise<void> {
  if (typeof document === 'undefined' || !document.hidden) return Promise.resolve()
  return new Promise((resolve) => {
    tabHiddenWaiters.push(resolve)
  })
}

/** מונע כיבוי מסך במהלך העלאה ארוכה (Chrome / Edge). */
export async function requestUploadWakeLock(): Promise<() => void> {
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

export type GalleryUploadProgress = {
  /** הושלמו (נשמרו ב-DB + הועלו ל-R2) */
  completed: number
  /** ממתינות להעלאה ל-R2 */
  staged: number
  total: number
  phase: 'preparing' | 'uploading' | 'registering'
  failed?: number
}

type PresignApiOk = {
  uploadUrl: string
  url: string
  key: string
}

type PresignApiFail = { ok: false; message: string }

type BatchPresignUrls = Record<
  string,
  { original: PresignApiOk; thumbnail: PresignApiOk }
>

type ReservedImage = {
  id: string
  original_ext: string
}

type UploadJob = {
  file: File
  imageId: string
  originalExt: string
}

export type PendingUploadSlot = {
  id: string
  original_ext: string
}

export type GalleryUploadOptions = {
  /** שורות pending קיימות — דילוג על reserve */
  existingJobs?: UploadJob[]
  /** במצב המשך העלאה — שורות שנכשלו נשארות pending לניסיון חוזר */
  resumeMode?: boolean
}

type MultipartApiFail = { ok: false; message: string }

type MultipartInitOk = {
  ok: true
  uploadId: string
  key: string
}

type MultipartPartUrlOk = { ok: true; url: string }

type MultipartSimpleOk = { ok: true }

type MultipartUploadedPart = {
  ETag: string
  PartNumber: number
}

async function reserveGalleryImagesBatch(
  albumId: string,
  files: File[]
): Promise<
  | { ok: true; reserved: ReservedImage[] }
  | { ok: false; message: string }
> {
  const response = await fetchWithRetry('/api/admin/album-images-reserve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...bulkUploadHeaders,
    },
    body: JSON.stringify({
      album_id: albumId,
      files: files.map((file) => ({ fileName: file.name })),
    }),
  })
  const data = (await response.json()) as
    | { ok: true; reserved: ReservedImage[] }
    | { ok: false; message: string }
  if (!response.ok || !data.ok) {
    return {
      ok: false,
      message: data.ok ? 'שגיאה בשמירת שורות' : data.message || 'שגיאה בשמירת שורות',
    }
  }
  return { ok: true, reserved: data.reserved }
}

async function markGalleryImagesReady(
  albumId: string,
  imageIds: string[]
): Promise<void> {
  if (imageIds.length === 0) return

  for (let i = 0; i < imageIds.length; i += READY_BATCH_SIZE) {
    const batch = imageIds.slice(i, i + READY_BATCH_SIZE)
    const response = await fetchWithRetry('/api/admin/album-images-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...bulkUploadHeaders,
      },
      body: JSON.stringify({
        album_id: albumId,
        image_ids: batch,
      }),
    })

    const data = (await response.json()) as { ok?: boolean; message?: string }
    if (!response.ok || !data.ok) {
      console.warn(
        'Failed to mark images as ready in DB:',
        data.message ?? response.status
      )
    }
  }
}

async function cleanupReservedImages(imageIds: string[]): Promise<void> {
  if (imageIds.length === 0) return

  for (let i = 0; i < imageIds.length; i += CLEANUP_BATCH_SIZE) {
    const batch = imageIds.slice(i, i + CLEANUP_BATCH_SIZE)
    await fetchWithRetry('/api/admin/album-images-cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...bulkUploadHeaders,
      },
      body: JSON.stringify({ image_ids: batch }),
    }).catch(() => {})
  }
}

async function requestGalleryPresignedPutBatch(
  albumId: string,
  jobs: UploadJob[]
): Promise<{ ok: true; urls: BatchPresignUrls } | PresignApiFail> {
  const response = await fetchWithRetry('/api/admin/r2-presign-batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...bulkUploadHeaders,
    },
    body: JSON.stringify({
      album_id: albumId,
      items: jobs.map((job) => ({
        imageId: job.imageId,
        originalExt: job.originalExt,
        contentType: job.file.type || 'application/octet-stream',
      })),
    }),
  })

  const data = (await response.json()) as
    | { ok: true; urls: BatchPresignUrls }
    | { ok: false; message: string }

  if (!response.ok || !data.ok) {
    return {
      ok: false,
      message: data.ok
        ? 'שגיאה ביצירת קישורי העלאה'
        : data.message || 'שגיאה ביצירת קישורי העלאה',
    }
  }

  return { ok: true, urls: data.urls }
}

/**
 * PUT ישיר ל-R2 — ללא retry אוטומטי.
 * CORS/נטפרי נכשלים ב-TypeError; retry רק מכפיל את הבקשות (אייקון 🔁 ב-Network).
 * Presigned URL חתום על host בלבד — לא שולחים Content-Type מיותר.
 */
async function fetchR2Put(url: string, body: Blob | File): Promise<Response> {
  return fetch(url, { method: 'PUT', body })
}

async function putFileToPresignedUrl(
  file: File,
  presign: PresignApiOk
): Promise<{ ok: true } | { ok: false; message: string }> {
  let putResponse: Response
  try {
    putResponse = await fetchR2Put(presign.uploadUrl, file)
  } catch (error) {
    const netfree =
      error instanceof TypeError &&
      String(error.message).toLowerCase().includes('fetch')
    return {
      ok: false,
      message: netfree
        ? `העלאה ל-R2 נכשלה (רשת/CORS) — בדקי CORS ב-bucket ונטפרי (*.r2.cloudflarestorage.com)`
        : `העלאה ל-R2 נכשלה: ${error instanceof Error ? error.message : 'שגיאת רשת'}`,
    }
  }

  if (!putResponse.ok) {
    const hint =
      putResponse.status === 0 || putResponse.type === 'opaque'
        ? ' — ייתכן שחסר CORS ב-bucket של R2 (PUT מהדפדפן)'
        : putResponse.status === 403
          ? ' — הגדירי CORS ב-bucket (קובץ r2-cors.json) או הוסיפי *.r2.cloudflarestorage.com לנטפרי'
          : ''
    return {
      ok: false,
      message: `העלאה ל-R2 נכשלה (HTTP ${putResponse.status})${hint}`,
    }
  }

  return { ok: true }
}

async function requestGalleryMultipart(
  payload: Record<string, unknown>
): Promise<
  | MultipartInitOk
  | MultipartPartUrlOk
  | MultipartSimpleOk
  | MultipartApiFail
> {
  const response = await fetchWithRetry('/api/admin/r2-multipart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...bulkUploadHeaders,
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json()) as
    | MultipartInitOk
    | MultipartPartUrlOk
    | MultipartSimpleOk
    | MultipartApiFail

  if (!response.ok || !data.ok) {
    return {
      ok: false,
      message: data.ok
        ? 'שגיאה בהעלאת קובץ גדול'
        : data.message || 'שגיאה בהעלאת קובץ גדול',
    }
  }

  return data
}

async function abortGalleryMultipartUpload(
  albumId: string,
  job: UploadJob,
  uploadId: string
): Promise<void> {
  await requestGalleryMultipart({
    action: 'abort',
    album_id: albumId,
    imageId: job.imageId,
    originalExt: job.originalExt,
    uploadId,
  }).catch(() => {})
}

async function uploadMultipartPartWithRetry(
  url: string,
  chunk: Blob
): Promise<{ ok: true; etag: string } | { ok: false; message: string }> {
  let lastMessage = 'שגיאה בהעלאת חלק'

  for (let attempt = 1; attempt <= MULTIPART_PART_MAX_ATTEMPTS; attempt += 1) {
    await waitWhileTabHidden()
    try {
      const uploadRes = await fetchR2Put(url, chunk)
      if (!uploadRes.ok) {
        lastMessage = `העלאת חלק נכשלה (HTTP ${uploadRes.status})`
      } else {
        const etag = uploadRes.headers.get('ETag')?.trim()
        if (!etag) {
          lastMessage = 'R2 לא החזיר ETag לחלק'
        } else {
          return { ok: true, etag }
        }
      }
    } catch (error) {
      lastMessage =
        error instanceof Error ? error.message : 'שגיאת רשת בהעלאת חלק'
    }

    if (attempt < MULTIPART_PART_MAX_ATTEMPTS) {
      await sleep(MULTIPART_PART_RETRY_BASE_MS * attempt)
    }
  }

  return { ok: false, message: lastMessage }
}

/** העלאת מקור גדול (מעל 100MB) ב-Multipart — ללא מיניאטורה בדפדפן. */
async function uploadLargeFileMultipart(
  albumId: string,
  job: UploadJob
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { file, imageId, originalExt } = job

  const init = await requestGalleryMultipart({
    action: 'init',
    album_id: albumId,
    imageId,
    originalExt,
    contentType: file.type || 'application/octet-stream',
  })

  if (!init.ok || !('uploadId' in init)) {
    return {
      ok: false,
      message: init.ok ? 'שגיאה בייזום העלאה' : init.message,
    }
  }

  const { uploadId } = init
  const totalParts = Math.ceil(file.size / MULTIPART_CHUNK_SIZE)
  const uploadedParts: MultipartUploadedPart[] = []

  try {
    for (let partIndex = 0; partIndex < totalParts; partIndex += 1) {
      const partNumber = partIndex + 1
      const start = partIndex * MULTIPART_CHUNK_SIZE
      const end = Math.min(start + MULTIPART_CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      const partUrl = await requestGalleryMultipart({
        action: 'get-part-url',
        album_id: albumId,
        imageId,
        originalExt,
        uploadId,
        partNumber,
      })

      if (!partUrl.ok || !('url' in partUrl)) {
        throw new Error(
          partUrl.ok ? 'חסר קישור לחלק' : partUrl.message
        )
      }

      const uploaded = await uploadMultipartPartWithRetry(partUrl.url, chunk)
      if (!uploaded.ok) {
        throw new Error(`${file.name}: ${uploaded.message} (חלק ${partNumber})`)
      }

      uploadedParts.push({
        ETag: uploaded.etag,
        PartNumber: partNumber,
      })
    }

    const complete = await requestGalleryMultipart({
      action: 'complete',
      album_id: albumId,
      imageId,
      originalExt,
      uploadId,
      parts: uploadedParts,
    })

    if (!complete.ok) {
      return { ok: false, message: complete.message }
    }

    return { ok: true }
  } catch (error) {
    await abortGalleryMultipartUpload(albumId, job, uploadId)
    const message =
      error instanceof Error
        ? error.message
        : `שגיאה בהעלאת ${file.name}`
    return { ok: false, message }
  }
}

type PreparedUploadJob = UploadJob & { thumbnail: File }

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  if (items.length === 0) return
  let nextIndex = 0

  async function runWorker() {
    for (;;) {
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) return
      await worker(items[index], index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
  )
}

async function prepareUploadJobs(jobs: UploadJob[]): Promise<{
  prepared: PreparedUploadJob[]
  errors: Array<{ job: UploadJob; message: string }>
}> {
  const prepared: PreparedUploadJob[] = []
  const errors: Array<{ job: UploadJob; message: string }> = []

  await runWithConcurrency(jobs, THUMB_COMPRESS_CONCURRENCY, async (job) => {
    try {
      const thumbnail = await compressGalleryThumbnail(job.file)
      prepared.push({ ...job, thumbnail })
    } catch {
      errors.push({ job, message: `כיווץ נכשל: ${job.file.name}` })
    }
  })

  return { prepared, errors }
}

async function uploadPreparedFilesToR2(
  job: PreparedUploadJob,
  presigned: { original: PresignApiOk; thumbnail: PresignApiOk }
): Promise<{ ok: true } | { ok: false; message: string }> {
  const [originalUpload, thumbnailUpload] = await Promise.all([
    putFileToPresignedUrl(job.file, presigned.original),
    putFileToPresignedUrl(job.thumbnail, presigned.thumbnail),
  ])

  if (!originalUpload.ok) {
    return { ok: false, message: `${job.file.name}: ${originalUpload.message}` }
  }
  if (!thumbnailUpload.ok) {
    return { ok: false, message: `${job.file.name}: ${thumbnailUpload.message}` }
  }

  return { ok: true }
}

type PreparedUploadChunk = {
  chunk: UploadJob[]
  presigned: BatchPresignUrls
  prepared: PreparedUploadJob[]
}

async function prepareUploadChunk(
  albumId: string,
  chunk: UploadJob[]
): Promise<
  | {
      ok: true
      data: PreparedUploadChunk
      prepErrors: Array<{ job: UploadJob; message: string }>
    }
  | { ok: false; message: string }
> {
  const presigned = await requestGalleryPresignedPutBatch(albumId, chunk)
  if (!presigned.ok) {
    return { ok: false, message: presigned.message }
  }

  const ready = await prepareUploadJobs(chunk)

  return {
    ok: true,
    data: {
      chunk,
      presigned: presigned.urls,
      prepared: ready.prepared,
    },
    prepErrors: ready.errors,
  }
}

async function uploadPreparedChunk(
  albumId: string,
  data: PreparedUploadChunk,
  onItemDone: (success: boolean) => void
): Promise<{
  successfulIds: string[]
  errors: string[]
  failedIds: string[]
}> {
  const successfulIds: string[] = []
  const errors: string[] = []
  const failedIds: string[] = []
  let nextIndex = 0

  async function worker() {
    for (;;) {
      const index = nextIndex
      nextIndex += 1
      if (index >= data.prepared.length) return

      await waitWhileTabHidden()
      const job = data.prepared[index]
      const urls = data.presigned[job.imageId]
      if (!urls) {
        errors.push(`${job.file.name}: חסרים קישורי העלאה`)
        failedIds.push(job.imageId)
        onItemDone(false)
        continue
      }

      try {
        const result = await withTimeout(
          uploadPreparedFilesToR2(job, urls),
          PER_FILE_TIMEOUT_MS,
          `${job.file.name}: פג תוקף ההעלאה (${PER_FILE_TIMEOUT_MS / 1000} שניות)`
        )
        if (result.ok) {
          successfulIds.push(job.imageId)
          onItemDone(true)
        } else {
          errors.push(result.message)
          failedIds.push(job.imageId)
          onItemDone(false)
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : `שגיאה בהעלאת ${job.file.name}`
        errors.push(msg)
        failedIds.push(job.imageId)
        onItemDone(false)
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(UPLOAD_CONCURRENCY, data.prepared.length) },
      () => worker()
    )
  )

  await markGalleryImagesReady(albumId, successfulIds)
  return { successfulIds, errors, failedIds }
}

async function reserveAllUploadJobs(
  albumId: string,
  files: File[]
): Promise<
  | { ok: true; jobs: UploadJob[] }
  | { ok: false; message: string }
> {
  const jobs: UploadJob[] = []

  for (let offset = 0; offset < files.length; offset += RESERVE_BATCH_SIZE) {
    const chunk = files.slice(offset, offset + RESERVE_BATCH_SIZE)
    const reserved = await reserveGalleryImagesBatch(albumId, chunk)
    if (!reserved.ok) {
      await cleanupReservedImages(jobs.map((job) => job.imageId))
      return { ok: false, message: reserved.message }
    }
    if (reserved.reserved.length !== chunk.length) {
      await cleanupReservedImages(jobs.map((job) => job.imageId))
      return { ok: false, message: 'מספר השורות השמורות לא תואם לקבצים' }
    }

    chunk.forEach((file, index) => {
      const row = reserved.reserved[index]
      jobs.push({
        file,
        imageId: row.id,
        originalExt: row.original_ext,
      })
    })
  }

  return { ok: true, jobs }
}

export async function fetchPendingUploadSlots(
  albumId: string
): Promise<
  | { ok: true; pending: PendingUploadSlot[] }
  | { ok: false; message: string }
> {
  const response = await fetchWithRetry(
    `/api/admin/album-images-pending?album_id=${encodeURIComponent(albumId)}`
  )
  const data = (await response.json()) as
    | { ok: true; pending: PendingUploadSlot[] }
    | { ok: false; message: string }

  if (!response.ok || !data.ok) {
    return {
      ok: false,
      message: data.ok ? 'שגיאה בטעינת שורות ממתינות' : data.message,
    }
  }

  return { ok: true, pending: data.pending }
}

export async function cleanupAlbumPendingImages(
  albumId: string
): Promise<{ ok: true; deletedCount: number; message: string } | { ok: false; message: string }> {
  const response = await fetchWithRetry('/api/admin/album-images-cleanup-pending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ album_id: albumId }),
  })

  const data = (await response.json()) as
    | { ok: true; deletedCount: number; message: string }
    | { ok: false; message: string }

  if (!response.ok || !data.ok) {
    return {
      ok: false,
      message: data.ok ? 'שגיאה בניקוי שורות תלויות' : data.message,
    }
  }

  return data
}

function buildJobsFromPendingSlots(
  files: File[],
  slots: PendingUploadSlot[]
): UploadJob[] {
  return files.map((file, index) => ({
    file,
    imageId: slots[index].id,
    originalExt: slots[index].original_ext,
  }))
}

/** המשך העלאה לשורות pending קיימות — בדיוק אותו מספר קבצים כמו שורות ממתינות. */
export async function uploadGalleryImagesResume(
  albumId: string,
  files: File[],
  onProgress: (progress: GalleryUploadProgress) => void
): Promise<{ ok: true; uploaded: number } | { ok: false; uploaded: number; message: string }> {
  const pending = await fetchPendingUploadSlots(albumId)
  if (!pending.ok) {
    return { ok: false, uploaded: 0, message: pending.message }
  }

  const slotCount = pending.pending.length
  if (slotCount === 0) {
    return {
      ok: false,
      uploaded: 0,
      message: 'אין שורות ממתינות — השתמשי ב"העלאת תמונות" רגילה',
    }
  }

  if (files.length !== slotCount) {
    return {
      ok: false,
      uploaded: 0,
      message: `יש ${formatGalleryUploadCount(slotCount)} שורות ממתינות — בחרי בדיוק ${formatGalleryUploadCount(slotCount)} קבצים (נבחרו ${formatGalleryUploadCount(files.length)})`,
    }
  }

  const jobs = buildJobsFromPendingSlots(files, pending.pending)
  return uploadGalleryImagesWithQueue(albumId, files, onProgress, {
    existingJobs: jobs,
    resumeMode: true,
  })
}

export function buildAdminBulkDownloadUrl(albumId: string, imageIds: string[]): string {
  const unique = [...new Set(imageIds.map((id) => id.trim()).filter(Boolean))]
  return `/api/admin/album-images-download?album_id=${encodeURIComponent(albumId)}&ids=${encodeURIComponent(unique.join(','))}`
}

type SuperBatchProgress = {
  completed: number
  processed: number
  failed: number
  phase: GalleryUploadProgress['phase']
}

type SuperBatchResult = {
  completed: number
  errors: string[]
  /** כשל תשתיתי (reserve) — אין טעם להמשיך למנות הבאות */
  fatal: boolean
}

/**
 * מריץ מנת-על אחת מקצה לקצה: reserve → presign → כיווץ → PUT → complete.
 * בסיום משחרר את ה-Worker pool כדי שהזיכרון של המנה ישוחרר לפני המנה הבאה.
 */
async function runUploadSuperBatch(
  albumId: string,
  files: File[],
  existingJobs: UploadJob[] | undefined,
  resumeMode: boolean,
  report: (progress: SuperBatchProgress) => void
): Promise<SuperBatchResult> {
  const uploadErrors: string[] = []
  const failedImageIds: string[] = []
  let completed = 0
  let processed = 0

  let jobs: UploadJob[]
  if (existingJobs) {
    jobs = existingJobs
  } else {
    const reserved = await reserveAllUploadJobs(albumId, files)
    if (!reserved.ok) {
      return { completed: 0, errors: [reserved.message], fatal: true }
    }
    jobs = reserved.jobs
  }

  const largeJobs = jobs.filter((job) => job.file.size >= MULTIPART_MIN_SIZE)
  const regularJobs = jobs.filter((job) => job.file.size < MULTIPART_MIN_SIZE)

  function reportProgress(phase: GalleryUploadProgress['phase']) {
    report({ completed, processed, failed: uploadErrors.length, phase })
  }

  reportProgress('uploading')

  try {
    for (const job of largeJobs) {
      await waitWhileTabHidden()
      try {
        const result = await uploadLargeFileMultipart(albumId, job)
        if (result.ok) {
          completed += 1
          await markGalleryImagesReady(albumId, [job.imageId])
        } else {
          uploadErrors.push(result.message)
          failedImageIds.push(job.imageId)
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : `שגיאה בהעלאת ${job.file.name}`
        uploadErrors.push(msg)
        failedImageIds.push(job.imageId)
      }

      processed += 1
      reportProgress('uploading')
    }

    let pendingPrepare: ReturnType<typeof prepareUploadChunk> | null = null

    for (let offset = 0; offset < regularJobs.length; offset += PRESIGN_BATCH_SIZE) {
      const chunk = regularJobs.slice(offset, offset + PRESIGN_BATCH_SIZE)
      const nextOffset = offset + PRESIGN_BATCH_SIZE

      if (!pendingPrepare) {
        pendingPrepare = prepareUploadChunk(albumId, chunk)
      }

      const prefetch =
        nextOffset < regularJobs.length
          ? prepareUploadChunk(
              albumId,
              regularJobs.slice(nextOffset, nextOffset + PRESIGN_BATCH_SIZE)
            )
          : null

      const prepared = await pendingPrepare
      pendingPrepare = prefetch

      if (!prepared.ok) {
        const chunkIds = chunk.map((job) => job.imageId)
        await cleanupReservedImages(chunkIds)
        for (const job of chunk) {
          uploadErrors.push(`${job.file.name}: ${prepared.message}`)
          failedImageIds.push(job.imageId)
          processed += 1
        }
        reportProgress('uploading')
        continue
      }

      for (const prepError of prepared.prepErrors) {
        uploadErrors.push(prepError.message)
        failedImageIds.push(prepError.job.imageId)
        processed += 1
      }

      const uploadResult = await uploadPreparedChunk(
        albumId,
        prepared.data,
        (success) => {
          processed += 1
          if (success) completed += 1
          reportProgress('uploading')
        }
      )

      uploadErrors.push(...uploadResult.errors)
      failedImageIds.push(...uploadResult.failedIds)

      if (BATCH_COOLDOWN_MS > 0 && nextOffset < regularJobs.length) {
        await sleep(BATCH_COOLDOWN_MS)
      }
    }

    if (failedImageIds.length > 0 && !resumeMode) {
      await cleanupReservedImages(failedImageIds)
    }
  } finally {
    // שחרור ה-Workers והבאפרים הפנימיים שלהם — ניקוי זיכרון בין מנות-על
    terminateThumbnailCompressPool()
  }

  return { completed, errors: uploadErrors, fatal: false }
}

/**
 * מעלה תמונות גלריה: שמירת שורות ב-Supabase (בלי URL) → העלאה ל-R2 בנתיב קבוע.
 * מעל SUPER_BATCH_SIZE תמונות ההעלאה מפוצלת אוטומטית למנות-על שרצות ברצף —
 * כל מנה מסיימת מקצה לקצה (כולל complete) ומשחררת זיכרון לפני המנה הבאה.
 */
export async function uploadGalleryImagesWithQueue(
  albumId: string,
  files: File[],
  onProgress: (progress: GalleryUploadProgress) => void,
  options?: GalleryUploadOptions
): Promise<{ ok: true; uploaded: number } | { ok: false; uploaded: number; message: string }> {
  const total = files.length
  if (total === 0) {
    return { ok: false, uploaded: 0, message: 'לא נבחרו תמונות' }
  }

  if (options?.existingJobs?.length && options.existingJobs.length !== files.length) {
    return {
      ok: false,
      uploaded: 0,
      message: 'מספר הקבצים לא תואם לשורות השמורות',
    }
  }

  const releaseWakeLock = await requestUploadWakeLock()

  const uploadErrors: string[] = []
  let completed = 0
  let processedBefore = 0

  onProgress({ completed: 0, staged: total, total, phase: 'preparing' })

  try {
    for (let offset = 0; offset < total; offset += SUPER_BATCH_SIZE) {
      const batchFiles = files.slice(offset, offset + SUPER_BATCH_SIZE)
      const batchJobs = options?.existingJobs?.length
        ? options.existingJobs.slice(offset, offset + SUPER_BATCH_SIZE)
        : undefined

      const batch = await runUploadSuperBatch(
        albumId,
        batchFiles,
        batchJobs,
        options?.resumeMode ?? false,
        ({ completed: batchCompleted, processed, failed, phase }) => {
          const failedTotal = uploadErrors.length + failed
          onProgress({
            completed: completed + batchCompleted,
            staged: Math.max(0, total - processedBefore - processed),
            total,
            phase,
            failed: failedTotal > 0 ? failedTotal : undefined,
          })
        }
      )

      completed += batch.completed
      uploadErrors.push(...batch.errors)
      processedBefore += batchFiles.length

      if (batch.fatal) break

      // הפוגה קצרה בין מנות-על — נותנת ל-GC לפנות זיכרון לפני המנה הבאה
      if (offset + SUPER_BATCH_SIZE < total) {
        await sleep(SUPER_BATCH_COOLDOWN_MS)
      }
    }
  } finally {
    terminateThumbnailCompressPool()
    releaseWakeLock()
  }

  const failCount = uploadErrors.length

  if (failCount === 0) {
    return { ok: true, uploaded: completed }
  }

  const shown = uploadErrors.slice(0, 3).join(' · ')
  const more =
    failCount > 3 ? ` (ועוד ${formatGalleryUploadCount(failCount - 3)} שגיאות)` : ''
  const partialHint =
    completed > 0
      ? options?.resumeMode
        ? ' התמונות שהצליחו נשמרו. לנותרות — "המשך העלאה" עם אותו מספר קבצים.'
        : ' התמונות שהצליחו נשמרו. לנותרות — "המשך העלאה" או העלאה חדשה.'
      : ''
  const restartHint =
    failCount > 50 && uploadErrors.every((msg) => msg.toLowerCase().includes('failed to fetch'))
      ? ' ייתכן שהשרת המקומי התאפס באמצע — נסי שוב, או העלי בחלקים של 200–300 תמונות.'
      : ''

  return {
    ok: false,
    uploaded: completed,
    message:
      completed > 0
        ? `הועלו ${formatGalleryUploadCount(completed)} מתוך ${formatGalleryUploadCount(total)}. ${shown}${more}.${partialHint}${restartHint}`
        : `${shown}${more}${restartHint}`,
  }
}

export function formatGalleryUploadCount(n: number): string {
  return n.toLocaleString('he-IL')
}

/** העלאת תמונת שער ישירות מהדפדפן ל-R2 (presigned PUT). */
export async function uploadAlbumCoverFromBrowser(
  albumId: string,
  file: File
): Promise<{ ok: boolean; message: string }> {
  if (!file.size) {
    return { ok: false, message: 'קובץ ריק' }
  }

  const presignResponse = await fetchWithRetry('/api/admin/r2-presign-cover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      albumId,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    }),
  })

  const presignData = (await presignResponse.json()) as
    | ({ ok: true } & PresignApiOk)
    | PresignApiFail

  if (!presignResponse.ok || !presignData.ok) {
    return {
      ok: false,
      message:
        (!presignData.ok && presignData.message) ||
        `שגיאה ביצירת קישור העלאה (HTTP ${presignResponse.status})`,
    }
  }

  const putResult = await putFileToPresignedUrl(file, presignData)
  if (!putResult.ok) {
    return putResult
  }

  const saveResponse = await fetchWithRetry('/api/admin/album-cover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      albumId,
      coverUrl: presignData.url,
    }),
  })

  const saveData = (await saveResponse.json()) as
    | { ok: true; message?: string }
    | PresignApiFail

  if (!saveResponse.ok || !saveData.ok) {
    return {
      ok: false,
      message:
        (!saveData.ok && saveData.message) ||
        `התמונה הועלתה ל-R2, אך שמירת השער נכשלה (HTTP ${saveResponse.status})`,
    }
  }

  return {
    ok: true,
    message: saveData.message || 'תמונת השער הועלתה',
  }
}
