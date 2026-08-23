'use server'

import { assertGalleryOwner } from '@/lib/auth/gallery-owner'
import { createAdminClient } from '@/lib/supabase/admin'
import { touchGallerySession } from '@/lib/gallery-session'
import { createPresignedDownloadUrl } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'

export type DownloadFileEntry = {
  filename: string
  url: string
}

type ResolvableDownloadType = 'original' | 'watermarked' | 'edited'

/**
 * Returns presigned R2 GET URLs for the requested files instead of building
 * a zip on the server. The old flow downloaded every file into the
 * serverless function's memory, zipped it there, then re-uploaded the zip —
 * for a gallery with hundreds of full-resolution originals that's multiple
 * GB flowing through (and buffered by) the function, risking an OOM kill or
 * timeout. Presigning is a cheap crypto operation; the actual file bytes
 * now go straight from R2 to the browser, which zips them client-side.
 */
async function resolveDownloadFiles(
  galleryId: string,
  type: ResolvableDownloadType,
  forcePrivateDomain: boolean
): Promise<DownloadFileEntry[]> {
  const admin = createAdminClient()
  const candidates: { bucket: MediaBucket; path: string }[] = []

  if (type === 'original' || type === 'watermarked') {
    const { data: photos } = await admin
      .from('photos')
      .select('id, original_url, preview_url, watermarked_preview_url')
      .eq('gallery_id', galleryId)
      .eq('is_visible_to_client', true)

    type PhotoRow = {
      id: string
      original_url: string | null
      preview_url: string | null
      watermarked_preview_url: string | null
    }

    for (const photo of (photos ?? []) as PhotoRow[]) {
      let path: string | null = null
      let bucket: MediaBucket = 'previews'

      if (type === 'original') {
        path = photo.original_url ?? photo.preview_url
        bucket = photo.original_url ? 'originals' : 'previews'
      } else {
        path = photo.watermarked_preview_url
        bucket = 'watermarked'
      }

      if (path) candidates.push({ bucket, path })
    }
  }

  if (type === 'edited') {
    // A "delivered" photo is either a precise per-selection match
    // (edited_photos, from the dedicated Selections page) or simply marked
    // processed through the general upload tab — same as the client-facing
    // gallery view treats it. Dedupe so a photo matched both ways isn't
    // included twice.
    const matchedPhotoIds = new Set<string>()

    const { data: edited } = await admin
      .from('edited_photos')
      .select('photo_id, final_url')
      .eq('gallery_id', galleryId)

    for (const row of (edited ?? []) as { photo_id: string; final_url: string | null }[]) {
      if (!row.final_url) continue
      candidates.push({ bucket: 'edited', path: row.final_url })
      matchedPhotoIds.add(row.photo_id)
    }

    const { data: processedPhotos } = await admin
      .from('photos')
      .select('id, original_url, preview_url')
      .eq('gallery_id', galleryId)
      .eq('is_processed', true)
      .eq('is_visible_to_client', true)

    type ProcessedRow = { id: string; original_url: string | null; preview_url: string | null }

    for (const photo of (processedPhotos ?? []) as ProcessedRow[]) {
      if (matchedPhotoIds.has(photo.id)) continue
      const path = photo.original_url ?? photo.preview_url
      if (path) candidates.push({ bucket: photo.original_url ? 'originals' : 'previews', path })
    }
  }

  return presignCandidates(candidates, forcePrivateDomain)
}

async function presignCandidates(
  candidates: { bucket: MediaBucket; path: string; folder?: string }[],
  forcePrivateDomain: boolean
): Promise<DownloadFileEntry[]> {
  if (candidates.length === 0) {
    throw new Error('אין קבצים להורדה')
  }

  return Promise.all(
    candidates.map(async ({ bucket, path, folder }) => ({
      filename: folder ? `${folder}/${path.split('/').pop()!}` : path.split('/').pop()!,
      url: await createPresignedDownloadUrl(bucket, path, 3600, { forcePrivateDomain }),
    }))
  )
}

/**
 * Photographer's own dashboard download of the client's actual selections
 * (album + edit picks) — not every photo in the gallery. A private
 * selection gallery can hold hundreds of photos the client never chose;
 * downloading all of them at original quality just to find the handful
 * that need editing defeats the point of the selection step.
 *
 * Album and edit picks are kept as two separate lists (not merged/deduped)
 * so the zip can sort each into its own "אלבום"/"עיבוד" folder — a photo
 * selected for both shows up in both folders, once each, matching what the
 * photographer sees as two distinct selection columns in the dashboard.
 */
export async function getSelectedPhotosOriginalFiles(
  galleryId: string,
  albumPhotoIds: string[],
  editPhotoIds: string[]
): Promise<DownloadFileEntry[]> {
  await assertGalleryOwner(galleryId)

  const allPhotoIds = [...new Set([...albumPhotoIds, ...editPhotoIds])]
  if (allPhotoIds.length === 0) {
    throw new Error('אין תמונות נבחרות להורדה')
  }

  const admin = createAdminClient()
  const { data: photos } = await admin
    .from('photos')
    .select('id, original_url, preview_url')
    .eq('gallery_id', galleryId)
    .in('id', allPhotoIds)

  type PhotoRow = { id: string; original_url: string | null; preview_url: string | null }

  const albumIdSet = new Set(albumPhotoIds)
  const editIdSet = new Set(editPhotoIds)

  const candidates: { bucket: MediaBucket; path: string; folder: string }[] = []
  for (const photo of (photos ?? []) as PhotoRow[]) {
    const path = photo.original_url ?? photo.preview_url
    if (!path) continue
    const bucket: MediaBucket = photo.original_url ? 'originals' : 'previews'
    if (albumIdSet.has(photo.id)) candidates.push({ bucket, path, folder: 'אלבום' })
    if (editIdSet.has(photo.id)) candidates.push({ bucket, path, folder: 'עיבוד' })
  }

  // Always through the private domain, regardless of the gallery's own
  // public/private status — this is the photographer's own workflow, and it
  // must never come back filtered/blocked by a client-side content filter.
  return presignCandidates(candidates, true)
}

/** Client-facing download of regular/watermarked photos, gated by the photographer's allow_download_* settings. */
export async function getClientGalleryDownloadFiles(
  galleryId: string,
  type: 'watermarked' | 'original'
): Promise<DownloadFileEntry[]> {
  // A hand-crafted request bypassing the client could pass a garbage type
  // value — validate strictly before anything downstream defaults it to
  // 'original', or the permission checks below would never fire.
  if (type !== 'watermarked' && type !== 'original') {
    throw new Error('סוג הורדה לא תקין')
  }

  const allowed = await touchGallerySession(galleryId)
  if (!allowed) throw new Error('גישה נדחתה')

  const admin = createAdminClient()
  const { data: galleryData } = await admin
    .from('galleries')
    .select('id, is_public, gallery_settings(allow_download_preview, allow_download_original)')
    .eq('id', galleryId)
    .single()

  type GalleryRow = {
    id: string
    is_public: boolean
    gallery_settings:
      | { allow_download_preview: boolean; allow_download_original: boolean }
      | { allow_download_preview: boolean; allow_download_original: boolean }[]
      | null
  }

  const gallery = galleryData as GalleryRow | null
  if (!gallery) throw new Error('גלריה לא נמצאה')

  const settings = Array.isArray(gallery.gallery_settings)
    ? gallery.gallery_settings[0]
    : gallery.gallery_settings

  if (type === 'watermarked' && !settings?.allow_download_preview) {
    throw new Error('הורדת תמונות עם סימן מים לא מורשית')
  }

  if (type === 'original' && !settings?.allow_download_original) {
    throw new Error('הורדת תמונות מקור לא מורשית')
  }

  return resolveDownloadFiles(galleryId, type, !gallery.is_public)
}

/** Client-facing download of the photographer's edited/delivered photos. */
export async function getClientEditedDownloadFiles(
  galleryId: string
): Promise<DownloadFileEntry[]> {
  const allowed = await touchGallerySession(galleryId)
  if (!allowed) throw new Error('גישה נדחתה')

  const admin = createAdminClient()
  const { data: galleryData } = await admin
    .from('galleries')
    .select('id, status, is_public')
    .eq('id', galleryId)
    .single()

  const gallery = galleryData as { id: string; status: string; is_public: boolean } | null
  if (!gallery) throw new Error('גלריה לא נמצאה')
  if (!['delivery_ready', 'locked'].includes(gallery.status)) {
    throw new Error('ההורדה תיפתח כשהגלריה מוכנה למסירה')
  }

  return resolveDownloadFiles(galleryId, 'edited', !gallery.is_public)
}
