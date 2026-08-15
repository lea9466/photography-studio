'use client'

import JSZip from 'jszip'

export type DownloadFileEntry = {
  filename: string
  url: string
}

const CONCURRENCY = 4

/**
 * Fetches each file directly from its (R2) presigned URL — browser to
 * storage, no server in between — and zips them client-side before
 * triggering a local download. Keeps large batch downloads (hundreds of
 * full-resolution originals) off the serverless function entirely, so
 * there's no server memory/time budget to blow.
 */
export async function downloadFilesAsZip(
  files: DownloadFileEntry[],
  zipFilename: string,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (files.length === 0) {
    throw new Error('אין קבצים להורדה')
  }

  const zip = new JSZip()
  let completed = 0
  let nextIndex = 0

  async function worker() {
    for (;;) {
      const index = nextIndex++
      if (index >= files.length) return
      const file = files[index]

      const response = await fetch(file.url)
      if (!response.ok) {
        throw new Error(`הורדת ${file.filename} נכשלה`)
      }
      const buffer = await response.arrayBuffer()
      zip.file(file.filename, buffer)

      completed++
      onProgress?.(completed, files.length)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker)
  )

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
}
