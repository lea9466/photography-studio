/** Shared client preview compression — gallery photos and cover _card variants. */
export const PREVIEW_MAX_MB = 0.18
export const PREVIEW_MAX_DIMENSION = 1200
export const PREVIEW_QUALITY = 0.78
export const PREVIEW_MAX_ITERATION = 4

export const PREVIEW_COMPRESSION_OPTIONS = {
  maxSizeMB: PREVIEW_MAX_MB,
  maxWidthOrHeight: PREVIEW_MAX_DIMENSION,
  // JS is single-threaded — with this off, every photo's compression ran on
  // the main thread, one at a time, even though the upload pipeline has 3
  // "concurrent" workers (that concurrency only ever helped the network
  // part). For a large batch this could freeze the tab for extended
  // stretches, which is a plausible real contributor to uploads appearing to
  // hang/crash. A same-origin blob worker isn't restricted by this app's CSP
  // (see next.config.ts) — safe to enable.
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: PREVIEW_QUALITY,
  maxIteration: PREVIEW_MAX_ITERATION,
}
