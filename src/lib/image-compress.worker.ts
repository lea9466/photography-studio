import imageCompression from 'browser-image-compression'

export type CompressWorkerRequest = {
  id: number
  file: File
  maxSizeMB: number
  maxWidthOrHeight: number
  initialQuality: number
  maxIteration: number
}

export type CompressWorkerSuccess = {
  id: number
  ok: true
  blob: Blob
  fileName: string
}

export type CompressWorkerFailure = {
  id: number
  ok: false
  message: string
}

export type CompressWorkerResponse = CompressWorkerSuccess | CompressWorkerFailure

self.onmessage = async (event: MessageEvent<CompressWorkerRequest>) => {
  const { id, file, maxSizeMB, maxWidthOrHeight, initialQuality, maxIteration } =
    event.data

  try {
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'photo'
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: false,
      fileType: 'image/webp',
      initialQuality,
      maxIteration,
    })

    const response: CompressWorkerSuccess = {
      id,
      ok: true,
      blob: compressed,
      fileName: `${baseName}.webp`,
    }
    self.postMessage(response)
  } catch (error) {
    const response: CompressWorkerFailure = {
      id,
      ok: false,
      message: error instanceof Error ? error.message : 'כיווץ נכשל',
    }
    self.postMessage(response)
  }
}
