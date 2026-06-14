const MAX_PREVIEW_SIZE = 1600
const PREVIEW_QUALITY = 0.82
const WATERMARK_QUALITY = 0.85

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('טעינת התמונה נכשלה'))
    }
    img.src = url
  })
}

function resizeCanvas(
  img: HTMLImageElement,
  maxSize: number
): HTMLCanvasElement {
  const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
  const width = Math.round(img.width * ratio)
  const height = Math.round(img.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('יצירת preview נכשלה'))
      },
      'image/jpeg',
      quality
    )
  })
}

function applyWatermark(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const fontSize = Math.max(16, Math.round(canvas.width * 0.04))
  ctx.font = `600 ${fontSize}px Heebo, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  return canvas
}

export type ProcessedImages = {
  preview: Blob
  watermarked: Blob
}

export async function processImageFile(
  file: File,
  watermarkText?: string
): Promise<ProcessedImages> {
  const img = await loadImage(file)
  const previewCanvas = resizeCanvas(img, MAX_PREVIEW_SIZE)
  const preview = await canvasToBlob(previewCanvas, PREVIEW_QUALITY)

  const watermarkedCanvas = resizeCanvas(img, MAX_PREVIEW_SIZE)
  if (watermarkText?.trim()) {
    applyWatermark(watermarkedCanvas, watermarkText.trim())
  }
  const watermarked = await canvasToBlob(watermarkedCanvas, WATERMARK_QUALITY)

  return { preview, watermarked }
}

export function buildStoragePath(
  userId: string,
  galleryId: string,
  filename: string
) {
  return `${userId}/${galleryId}/${filename}`
}

export function buildPhotoStoragePaths(
  userId: string,
  galleryId: string,
  photoId: string
) {
  const baseName = `${photoId}.jpg`
  return {
    originalPath: buildStoragePath(userId, galleryId, baseName),
    previewPath: buildStoragePath(userId, galleryId, `preview-${baseName}`),
    watermarkedPath: buildStoragePath(userId, galleryId, `wm-${baseName}`),
  }
}

export async function applyWatermarkToBlob(
  preview: Blob,
  watermarkText?: string
): Promise<Blob> {
  if (!watermarkText?.trim()) return preview

  const img = await loadImage(
    new File([preview], 'preview.jpg', { type: preview.type || 'image/jpeg' })
  )
  const canvas = resizeCanvas(img, MAX_PREVIEW_SIZE)
  applyWatermark(canvas, watermarkText.trim())
  return canvasToBlob(canvas, WATERMARK_QUALITY)
}
