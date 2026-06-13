const GALLERY_ORIGINAL_EXT_DEFAULT = 'jpg'

/** מזהה גלריה/תמונה בטוח ל-prefix (ללא / או ..). */
export function sanitizeGalleryStorageId(id: string): string | null {
  const trimmed = id.trim()
  if (!trimmed || !/^[\w-]+$/.test(trimmed)) return null
  return trimmed
}

/** סיומת בטוחה לשם קובץ מקור (ללא נקודה). */
export function sanitizeGalleryOriginalExt(ext: string | null | undefined): string {
  const cleaned = String(ext ?? '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '')
    .replace(/[^a-z0-9]+/g, '')
  return cleaned || GALLERY_ORIGINAL_EXT_DEFAULT
}

export function galleryOriginalExtensionFromFileName(fileName: string): string {
  const match = fileName.trim().match(/\.([a-zA-Z0-9]{2,5})$/)
  return sanitizeGalleryOriginalExt(match?.[1] ?? GALLERY_ORIGINAL_EXT_DEFAULT)
}

/** prefix: photographers/{photographerId}/galleries/{galleryId} או galleries/{galleryId} (legacy) */
export function buildGalleryStoragePrefix(
  galleryId: string,
  photographerId?: string | null
): string {
  const safeGallery = sanitizeGalleryStorageId(galleryId)
  if (!safeGallery) return ''

  const safePhotographer = photographerId
    ? sanitizeGalleryStorageId(photographerId)
    : null

  if (safePhotographer) {
    return `photographers/${safePhotographer}/galleries/${safeGallery}`
  }

  return `galleries/${safeGallery}`
}

/**
 * נתיב קבוע לפי מזהה תמונה — מאפשר שליפה מ-Supabase בלי URL מלאים.
 * thumbnails/{imageId}.webp · originals/{imageId}.{ext}
 */
export function buildDeterministicGalleryObjectKey(
  galleryId: string,
  imageId: string,
  kind: 'original' | 'thumbnail',
  originalExt?: string | null,
  photographerId?: string | null
): string {
  const prefix = buildGalleryStoragePrefix(galleryId, photographerId)
  const safeImage = sanitizeGalleryStorageId(imageId)
  if (!prefix || !safeImage) return ''

  if (kind === 'thumbnail') {
    return `${prefix}/thumbnails/${safeImage}.webp`
  }

  const ext = sanitizeGalleryOriginalExt(originalExt)
  return `${prefix}/originals/${safeImage}.${ext}`
}
