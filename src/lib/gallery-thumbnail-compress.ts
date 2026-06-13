'use client'

import imageCompression from 'browser-image-compression'
import type { CompressWorkerRequest, CompressWorkerResponse } from '@/lib/image-compress.worker'

export const THUMB_MAX_MB = 0.18
export const THUMB_MAX_DIMENSION = 1200
export const THUMB_QUALITY = 0.78
export const THUMB_MAX_ITERATION = 4
export const THUMB_COMPRESS_CONCURRENCY = 6

type PendingCompress = {
  file: File
  resolve: (file: File) => void
  reject: (error: Error) => void
}

/** מספר Workers לפי ליבות המעבד — שומר ליבה אחת ל-UI והעלאות. */
export function thumbnailWorkerPoolSize(): number {
  if (typeof navigator === 'undefined') return 2
  const cores = navigator.hardwareConcurrency || 4
  return Math.min(THUMB_COMPRESS_CONCURRENCY, Math.max(2, cores - 1))
}

function workerPoolSize(): number {
  return thumbnailWorkerPoolSize()
}

async function compressOnMainThread(file: File): Promise<File> {
  const baseName = file.name.replace(/\.[^/.]+$/, '') || 'photo'
  const compressed = await imageCompression(file, {
    maxSizeMB: THUMB_MAX_MB,
    maxWidthOrHeight: THUMB_MAX_DIMENSION,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: THUMB_QUALITY,
    maxIteration: THUMB_MAX_ITERATION,
  })

  return new File([compressed], `${baseName}.webp`, { type: 'image/webp' })
}

class ThumbnailCompressPool {
  private readonly workers: Worker[] = []
  private readonly inFlightIds: Array<number | null> = []
  private readonly queue: PendingCompress[] = []
  private readonly callbacks = new Map<
    number,
    { resolve: (file: File) => void; reject: (error: Error) => void }
  >()
  private nextId = 0

  constructor(size: number) {
    for (let i = 0; i < size; i += 1) {
      const worker = new Worker(
        new URL('./image-compress.worker.ts', import.meta.url),
        { type: 'module' }
      )
      const workerIndex = i
      worker.onmessage = (event: MessageEvent<CompressWorkerResponse>) => {
        this.handleMessage(workerIndex, event.data)
      }
      worker.onerror = () => {
        this.failInFlight(workerIndex, 'שגיאה ב-Worker כיווץ')
      }
      this.workers.push(worker)
      this.inFlightIds.push(null)
    }
  }

  private failInFlight(workerIndex: number, message: string) {
    const id = this.inFlightIds[workerIndex]
    if (id != null) {
      const callback = this.callbacks.get(id)
      if (callback) {
        this.callbacks.delete(id)
        callback.reject(new Error(message))
      }
      this.inFlightIds[workerIndex] = null
    }
    this.pump(workerIndex)
  }

  private handleMessage(workerIndex: number, data: CompressWorkerResponse) {
    const callback = this.callbacks.get(data.id)
    if (callback) {
      this.callbacks.delete(data.id)
      if (data.ok) {
        callback.resolve(
          new File([data.blob], data.fileName, { type: 'image/webp' })
        )
      } else {
        callback.reject(new Error(data.message))
      }
    }

    this.inFlightIds[workerIndex] = null
    this.pump(workerIndex)
  }

  private pump(workerIndex: number) {
    if (this.inFlightIds[workerIndex] != null || this.queue.length === 0) return

    const job = this.queue.shift()
    if (!job) return

    const id = (this.nextId += 1)
    this.inFlightIds[workerIndex] = id
    this.callbacks.set(id, {
      resolve: job.resolve,
      reject: job.reject,
    })

    const payload: CompressWorkerRequest = {
      id,
      file: job.file,
      maxSizeMB: THUMB_MAX_MB,
      maxWidthOrHeight: THUMB_MAX_DIMENSION,
      initialQuality: THUMB_QUALITY,
      maxIteration: THUMB_MAX_ITERATION,
    }

    this.workers[workerIndex].postMessage(payload)
  }

  compress(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      this.queue.push({ file, resolve, reject })
      for (let i = 0; i < this.workers.length; i += 1) {
        this.pump(i)
      }
    })
  }

  terminate() {
    for (const worker of this.workers) {
      worker.terminate()
    }
    this.workers.length = 0
    this.inFlightIds.length = 0
    this.queue.length = 0
    for (const callback of this.callbacks.values()) {
      callback.reject(new Error('העלאה הופסקה'))
    }
    this.callbacks.clear()
  }
}

let sharedPool: ThumbnailCompressPool | null = null

function getPool(): ThumbnailCompressPool {
  sharedPool ??= new ThumbnailCompressPool(workerPoolSize())
  return sharedPool
}

/** כיווץ ממוזער WebP — ברירת מחדל ב-Worker pool (לא חוסם UI). */
export async function compressGalleryThumbnail(file: File): Promise<File> {
  if (typeof Worker === 'undefined') {
    return compressOnMainThread(file)
  }

  try {
    return await getPool().compress(file)
  } catch {
    return compressOnMainThread(file)
  }
}

export function terminateThumbnailCompressPool(): void {
  sharedPool?.terminate()
  sharedPool = null
}
