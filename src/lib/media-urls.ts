import { isManagedMediaUrl as isManagedMediaUrlShared } from '@/lib/storage-urls'

/** מיניאטורה לגריד — R2/WebP מכווץ מראש; Supabase/שער כמו שהועלה */
export function mediaThumbUrl(url: string | null | undefined): string {
  const trimmed = url?.trim()
  if (!trimmed) return ''
  return trimmed
}

/** תצוגה מוגדלת / Lightbox */
export function mediaPreviewUrl(url: string | null | undefined): string {
  const trimmed = url?.trim()
  if (!trimmed) return ''
  return trimmed
}

/** גלריה ציבורית — מייסונרי */
export function mediaMasonryUrl(url: string | null | undefined): string {
  const trimmed = url?.trim()
  if (!trimmed) return ''
  return trimmed
}

/** srcSet — R2/Supabase ללא וריאנטים ב-URL */
export function mediaMasonrySrcSet(
  _url: string | null | undefined
): string | undefined {
  return undefined
}

/** כרטיס גלריה בדף הבית */
export function mediaCoverCardUrl(url: string | null | undefined): string {
  const trimmed = url?.trim()
  if (!trimmed) return ''
  return trimmed
}

/** URL מקורי להורדה */
export function mediaOriginalUrl(url: string | null | undefined): string {
  const trimmed = url?.trim()
  if (!trimmed) return ''
  return trimmed
}

export function isManagedMediaUrl(url: string | null | undefined): boolean {
  return isManagedMediaUrlShared(url)
}

/** גריד — מיניאטורה לפני מקור (כמו גלריה ציבורית) */
export function pickGridMediaUrl(
  thumbnailUrl: string | null | undefined,
  imageUrl: string | null | undefined
): string {
  const grid = (thumbnailUrl || imageUrl)?.trim()
  return grid ? mediaMasonryUrl(grid) : ''
}

/** Lightbox / תצוגה מוגדלת — מקור לפני מיניאטורה */
export function pickPreviewMediaUrl(
  thumbnailUrl: string | null | undefined,
  imageUrl: string | null | undefined
): string {
  const full = (imageUrl || thumbnailUrl)?.trim()
  return full ? mediaPreviewUrl(full) : ''
}
