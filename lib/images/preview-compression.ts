/** Shared client preview compression — gallery photos and cover _card variants. */
export const PREVIEW_MAX_MB = 0.18
export const PREVIEW_MAX_DIMENSION = 1200
export const PREVIEW_QUALITY = 0.78
export const PREVIEW_MAX_ITERATION = 4

export const PREVIEW_COMPRESSION_OPTIONS = {
  maxSizeMB: PREVIEW_MAX_MB,
  maxWidthOrHeight: PREVIEW_MAX_DIMENSION,
  useWebWorker: false,
  fileType: 'image/jpeg' as const,
  initialQuality: PREVIEW_QUALITY,
  maxIteration: PREVIEW_MAX_ITERATION,
}
