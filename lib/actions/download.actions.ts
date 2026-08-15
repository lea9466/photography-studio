'use server'

import { assertGalleryOwner } from '@/lib/auth/gallery-owner'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasGallerySession } from '@/lib/gallery-session'
import { createPresignedDownloadUrl } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'

export type DownloadFileEntry = {
  filename: string
  url: string
}

type ResolvableDownloadType = 'preview' | 'original' | 'watermarked' | 'edited'

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
  type: ResolvableDownloadType
): Promise<DownloadFileEntry[]> {
  const admin = createAdminClient()
  const candidates: { bucket: MediaBucket; path: string }[] = []

  if (type === 'preview' || type === 'original' || type === 'watermarked') {
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
      } else if (type === 'watermarked') {
        path = photo.watermarked_preview_url
        bucket = 'watermarked'
      } else {
        path = photo.preview_url
        bucket = 'previews'
      }

      if (path) candidates.push({ bucket, path })
    }
  }

  if (type === 'edited') {
    const { data: edited } = await admin
      .from('edited_photos')
      .select('final_url')
      .eq('gallery_id', galleryId)

    for (const row of edited ?? []) {
      const path = (row as { final_url: string | null }).final_url
      if (path) candidates.push({ bucket: 'edited', path })
    }
  }

  if (candidates.length === 0) {
    throw new Error('אין קבצים להורדה')
  }

  return Promise.all(
    candidates.map(async ({ bucket, path }) => ({
      filename: path.split('/').pop()!,
      url: await createPresignedDownloadUrl(bucket, path, 3600),
    }))
  )
}

/** Photographer's own dashboard download (SelectionsView). */
export async function getGalleryDownloadFiles(
  galleryId: string,
  type: 'preview' | 'original'
): Promise<DownloadFileEntry[]> {
  await assertGalleryOwner(galleryId)
  return resolveDownloadFiles(galleryId, type)
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

  const allowed = await hasGallerySession(galleryId)
  if (!allowed) throw new Error('גישה נדחתה')

  const admin = createAdminClient()
  const { data: galleryData } = await admin
    .from('galleries')
    .select('id, gallery_settings(allow_download_preview, allow_download_original)')
    .eq('id', galleryId)
    .single()

  type GalleryRow = {
    id: string
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

  return resolveDownloadFiles(galleryId, type)
}

/** Client-facing download of the photographer's edited/delivered photos. */
export async function getClientEditedDownloadFiles(
  galleryId: string
): Promise<DownloadFileEntry[]> {
  const allowed = await hasGallerySession(galleryId)
  if (!allowed) throw new Error('גישה נדחתה')

  const admin = createAdminClient()
  const { data: galleryData } = await admin
    .from('galleries')
    .select('id, status')
    .eq('id', galleryId)
    .single()

  const gallery = galleryData as { id: string; status: string } | null
  if (!gallery) throw new Error('גלריה לא נמצאה')
  if (!['delivery_ready', 'locked'].includes(gallery.status)) {
    throw new Error('ההורדה תיפתח כשהגלריה מוכנה למסירה')
  }

  return resolveDownloadFiles(galleryId, 'edited')
}
