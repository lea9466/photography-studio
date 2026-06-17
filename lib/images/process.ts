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

  const fontSize = Math.max(14, Math.round(canvas.width * 0.032))
  ctx.font = `600 ${fontSize}px Heebo, Arial, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.32)'
  ctx.strokeStyle = 'rgba(0,0,0,0.14)'
  ctx.lineWidth = 1
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const stepX = Math.max(fontSize * 4, text.length * fontSize * 0.55)
  const stepY = fontSize * 3.5

  ctx.save()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(-Math.PI / 6)

  const cols = Math.ceil(canvas.width / stepX) + 2
  const rows = Math.ceil(canvas.height / stepY) + 2

  for (let row = -rows; row <= rows; row += 1) {
    for (let col = -cols; col <= cols; col += 1) {
      const x = col * stepX + (row % 2) * (stepX / 2)
      const y = row * stepY
      ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
    }
  }

  ctx.restore()
  return canvas
}

export function resolveWatermarkText(
  watermarkText: string | null | undefined,
  studioName: string | null | undefined
) {
  const custom = watermarkText?.trim()
  if (custom) return custom

  const studio = studioName?.trim()
  if (studio) return studio

  return 'Studio Gallery'
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
  previewCanvas.width = 0
  previewCanvas.height = 0

  const watermarkedCanvas = resizeCanvas(img, MAX_PREVIEW_SIZE)
  if (watermarkText?.trim()) {
    applyWatermark(watermarkedCanvas, watermarkText.trim())
  }
  const watermarked = await canvasToBlob(watermarkedCanvas, WATERMARK_QUALITY)
  watermarkedCanvas.width = 0
  watermarkedCanvas.height = 0

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
  const text = watermarkText?.trim()
  if (!text) return preview

  const img = await loadImage(
    new File([preview], 'preview.jpg', { type: preview.type || 'image/jpeg' })
  )
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0)
  applyWatermark(canvas, text)
  const blob = await canvasToBlob(canvas, WATERMARK_QUALITY)
  canvas.width = 0
  canvas.height = 0
  return blob
}
