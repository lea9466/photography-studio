import {
  buildDeterministicGalleryObjectKey,
  galleryOriginalExtensionFromFileName,
} from '@/lib/gallery-r2-paths'
import { r2PublicBaseUrl, r2PublicUrlFromKey } from '@/lib/r2-public'
import { pickGridMediaUrl, pickPreviewMediaUrl } from '@/lib/media-urls'

/** בסיס ציבורי ל-R2 — NEXT_PUBLIC_R2_PUBLIC_URL או R2_PUBLIC_URL */
export function galleryR2BaseUrl(): string {
  return r2PublicBaseUrl()
}

export type GalleryImageRef = {
  id: string
  album_id?: string
  created_at?: string
  /** סיומת מקור (jpg, png…) — אופציונלי, ברירת מחדל jpg */
  original_ext?: string | null
  /** legacy — נטען רק באדמין / מסלולי תאימות */
  image_url?: string | null
  thumbnail_url?: string | null
}

export type ResolvedGalleryMedia = {
  thumb: string
  preview: string
  download: string
}

function hasLegacyStoredUrls(image: GalleryImageRef): boolean {
  return Boolean(image.image_url?.trim() || image.thumbnail_url?.trim())
}

/** מפתח R2 למיניאטורה */
export function galleryThumbnailObjectKey(
  albumId: string,
  imageId: string,
  photographerId?: string | null
): string {
  return buildDeterministicGalleryObjectKey(
    albumId,
    imageId,
    'thumbnail',
    undefined,
    photographerId
  )
}

/** מפתח R2 למקור */
export function galleryOriginalObjectKey(
  albumId: string,
  imageId: string,
  originalExt?: string | null,
  photographerId?: string | null
): string {
  return buildDeterministicGalleryObjectKey(
    albumId,
    imageId,
    'original',
    originalExt,
    photographerId
  )
}

export function galleryThumbnailUrl(
  albumId: string,
  imageId: string,
  photographerId?: string | null
): string {
  return r2PublicUrlFromKey(
    galleryThumbnailObjectKey(albumId, imageId, photographerId)
  )
}

export function galleryOriginalUrl(
  albumId: string,
  imageId: string,
  originalExt?: string | null,
  photographerId?: string | null
): string {
  return r2PublicUrlFromKey(
    galleryOriginalObjectKey(albumId, imageId, originalExt, photographerId)
  )
}

/**
 * בונה כתובות תצוגה — דינמית מ-R2 (מזהה אלבום + מזהה תמונה + צלם).
 * תמונות ישנות עם URL מלא ב-DB: fallback רק כשהשדות נטענו (אדמין).
 * ללא photographerId — נתיב legacy galleries/{albumId}/...
 */
export function resolveGalleryMediaUrls(
  albumId: string,
  image: GalleryImageRef,
  photographerId?: string | null
): ResolvedGalleryMedia {
  if (hasLegacyStoredUrls(image)) {
    const thumb = pickGridMediaUrl(image.thumbnail_url, image.image_url)
    const preview = pickPreviewMediaUrl(image.thumbnail_url, image.image_url)
    const download =
      (image.image_url || image.thumbnail_url)?.trim() || preview
    return { thumb, preview, download }
  }

  const thumb = galleryThumbnailUrl(albumId, image.id, photographerId)
  const preview = galleryOriginalUrl(
    albumId,
    image.id,
    image.original_ext,
    photographerId
  )
  return { thumb, preview, download: preview }
}

export function resolveAlbumViewerImages(
  albumId: string,
  images: GalleryImageRef[],
  photographerId?: string | null
): Array<GalleryImageRef & ResolvedGalleryMedia> {
  return images.map((image) => ({
    ...image,
    ...resolveGalleryMediaUrls(albumId, image, photographerId),
  }))
}

export function resolveGalleryPhotoUrls(
  albumId: string,
  image: GalleryImageRef,
  photographerId?: string | null
): { id: string; src: string; thumb: string; downloadSrc: string } | null {
  const { thumb, preview, download } = resolveGalleryMediaUrls(
    albumId,
    image,
    photographerId
  )
  if (!thumb && !preview) return null
  return {
    id: image.id,
    src: preview || thumb,
    thumb: thumb || preview,
    downloadSrc: download || preview || thumb,
  }
}

export { galleryOriginalExtensionFromFileName as originalExtFromUploadFileName }

