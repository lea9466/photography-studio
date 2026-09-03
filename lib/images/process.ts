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

/**
 * `corner` — a small stamp in the bottom-left (public site: portfolio, posts,
 * before/after). `center` — one large, faint mark across the middle of the
 * frame, used for client selection galleries: a corner stamp is trivially
 * cropped out, a centred one can't be removed without destroying the photo.
 */
export type WatermarkPlacement = 'corner' | 'center'

function applyCornerWatermark(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string
) {
  const fontSize = Math.max(14, Math.round(canvas.width * 0.032))
  const padding = Math.max(12, Math.round(canvas.width * 0.02))

  ctx.save()
  ctx.globalAlpha = 0.7
  ctx.font = `600 ${fontSize}px Heebo, Arial, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'

  const x = padding
  const y = canvas.height - padding
  ctx.strokeText(text, x, y)
  ctx.fillText(text, x, y)

  ctx.restore()
}

function applyCenterWatermark(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string
) {
  ctx.save()

  // Start large, then shrink to fit the frame's width with a margin so long
  // studio names never spill past the edges.
  const maxTextWidth = canvas.width * 0.86
  let fontSize = Math.max(18, Math.round(canvas.width * 0.11))
  ctx.font = `600 ${fontSize}px Heebo, Arial, sans-serif`
  const measured = ctx.measureText(text).width
  if (measured > maxTextWidth) {
    fontSize = Math.max(14, Math.floor(fontSize * (maxTextWidth / measured)))
    ctx.font = `600 ${fontSize}px Heebo, Arial, sans-serif`
  }

  const x = canvas.width / 2
  const y = canvas.height / 2

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Soft shadow keeps it legible on both light and dark photos.
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.12))
  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x, y)

  // Thin dark outline for separation against bright areas.
  ctx.shadowColor = 'transparent'
  ctx.globalAlpha = 0.18
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'
  ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.02))
  ctx.strokeText(text, x, y)

  ctx.restore()
}

function applyWatermark(
  canvas: HTMLCanvasElement,
  text: string,
  placement: WatermarkPlacement = 'corner'
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  if (placement === 'center') {
    applyCenterWatermark(ctx, canvas, text)
  } else {
    applyCornerWatermark(ctx, canvas, text)
  }

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
  width: number
  height: number
}

export async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const img = await loadImage(file)
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  }
}

export async function processImageFile(
  file: File,
  watermarkText?: string
): Promise<ProcessedImages> {
  const img = await loadImage(file)
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height
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

  return { preview, watermarked, width, height }
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

export function buildPostPhotoStoragePaths(
  userId: string,
  postId: string,
  photoId: string
) {
  const baseName = `${photoId}.jpg`
  const prefix = `${userId}/posts/${postId}`
  return {
    originalPath: `${prefix}/${baseName}`,
    previewPath: `${prefix}/preview-${baseName}`,
    watermarkedPath: `${prefix}/wm-${baseName}`,
  }
}

/** Display-only paths for before/after photo-edit pairs (no originals bucket). */
export function buildPhotoEditStoragePaths(
  userId: string,
  comparisonId: string,
  role: 'original' | 'edited'
) {
  // Unique key per upload so replacements invalidate CDN/browser cache and
  // the DB update path always differs from the previous stored value.
  const version =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Date.now().toString(36)
  const baseName = `${role}-${version}.jpg`
  const prefix = `${userId}/photo-edits/${comparisonId}`
  return {
    previewPath: `${prefix}/preview-${baseName}`,
    watermarkedPath: `${prefix}/wm-${baseName}`,
  }
}

export async function applyWatermarkToBlob(
  preview: Blob,
  watermarkText?: string,
  applyAutoWatermark = true,
  placement: WatermarkPlacement = 'corner'
): Promise<Blob> {
  if (!applyAutoWatermark) return preview

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
  applyWatermark(canvas, text, placement)
  const blob = await canvasToBlob(canvas, WATERMARK_QUALITY)
  canvas.width = 0
  canvas.height = 0
  return blob
}
