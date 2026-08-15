'use client'

import JSZip from 'jszip'

export type DownloadFileEntry = {
  filename: string
  url: string
}

export type ZipDownloadResult = {
  failed: string[]
}

const CONCURRENCY = 4
const FILE_TIMEOUT_MS = 120_000

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetches each file directly from its (R2) presigned URL — browser to
 * storage, no server in between — and zips them client-side before
 * triggering a local download. Keeps large batch downloads (hundreds of
 * full-resolution originals) off the serverless function entirely, so
 * there's no server memory/time budget to blow.
 *
 * A single stalled/failed file no longer blocks the rest: each fetch has
 * its own timeout, and a failure is recorded and skipped rather than
 * aborting the whole batch — the zip ships with whatever succeeded.
 */
export async function downloadFilesAsZip(
  files: DownloadFileEntry[],
  zipFilename: string,
  onProgress?: (completed: number, total: number) => void
): Promise<ZipDownloadResult> {
  if (files.length === 0) {
    throw new Error('אין קבצים להורדה')
  }

  const zip = new JSZip()
  const failed: string[] = []
  let completed = 0
  let nextIndex = 0

  async function worker() {
    for (;;) {
      const index = nextIndex++
      if (index >= files.length) return
      const file = files[index]

      try {
        const response = await fetchWithTimeout(file.url, FILE_TIMEOUT_MS)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const buffer = await response.arrayBuffer()
        zip.file(file.filename, buffer)
      } catch {
        failed.push(file.filename)
      }

      completed++
      onProgress?.(completed, files.length)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker)
  )

  if (failed.length === files.length) {
    throw new Error('כל ההורדות נכשלו')
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = zipFilename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)

  return { failed }
}
