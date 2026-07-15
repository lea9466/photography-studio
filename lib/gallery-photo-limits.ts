import type { createClient } from '@/lib/supabase/server'
import {
  PUBLIC_ONLY_MVP,
  buildPublicGalleryPhotoLimitError,
} from '@/lib/types/app.types'
import type { MediaBucket, R2UploadRequest } from '@/lib/r2/types'

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function getGalleryPhotoCount(
  supabase: AppSupabaseClient,
  galleryId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('gallery_id', galleryId)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function assertGalleryPhotoCountWithinLimit(
  supabase: AppSupabaseClient,
  galleryId: string,
  isPublic: boolean,
  adding = 0
): Promise<number> {
  if (!isPublic && !PUBLIC_ONLY_MVP) return 0

  const currentCount = await getGalleryPhotoCount(supabase, galleryId)
  const limitError = buildPublicGalleryPhotoLimitError(currentCount, adding)
  if (limitError) throw new Error(limitError)

  return currentCount
}

const UUID_FILENAME_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jpg$/i
const PREVIEW_FILENAME_RE =
  /^preview-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jpg$/i

function parseDisplayOnlyPhotoIds(
  prefix: string,
  items: R2UploadRequest[]
): string[] {
  if (items.length === 0 || items.length % 2 !== 0) {
    throw new Error('בקשת העלאה לא תקינה')
  }

  const previews = items.filter((item) => item.bucket === 'previews')
  if (previews.length * 2 !== items.length) {
    throw new Error('בקשת העלאה לא תקינה')
  }

  const photoIds = new Set<string>()

  for (const item of previews) {
    if (!item.path.startsWith(prefix)) {
      throw new Error('נתיב קובץ לא תקין')
    }

    const filename = item.path.slice(prefix.length)
    const match = filename.match(PREVIEW_FILENAME_RE)
    if (!match) {
      throw new Error('נתיב קובץ לא תקין')
    }

    const photoId = match[1]!
    photoIds.add(photoId)

    const expectedPaths = [
      { bucket: 'previews' as const, path: `${prefix}preview-${photoId}.jpg` },
      { bucket: 'watermarked' as const, path: `${prefix}wm-${photoId}.jpg` },
    ]

    for (const expected of expectedPaths) {
      const found = items.some(
        (entry) => entry.bucket === expected.bucket && entry.path === expected.path
      )
      if (!found) {
        throw new Error('בקשת העלאה לא תקינה')
      }
    }
  }

  return [...photoIds]
}

function parseFullPhotoIds(prefix: string, items: R2UploadRequest[]): string[] {
  if (items.length === 0 || items.length % 3 !== 0) {
    throw new Error('בקשת העלאה לא תקינה')
  }

  const originals = items.filter((item) => item.bucket === 'originals')
  if (originals.length * 3 !== items.length) {
    throw new Error('בקשת העלאה לא תקינה')
  }

  const photoIds = new Set<string>()

  for (const item of originals) {
    if (!item.path.startsWith(prefix)) {
      throw new Error('נתיב קובץ לא תקין')
    }

    const filename = item.path.slice(prefix.length)
    const match = filename.match(UUID_FILENAME_RE)
    if (!match) {
      throw new Error('נתיב קובץ לא תקין')
    }

    const photoId = match[1]!
    photoIds.add(photoId)

    const expectedPaths = [
      { bucket: 'originals' as const, path: `${prefix}${photoId}.jpg` },
      { bucket: 'previews' as const, path: `${prefix}preview-${photoId}.jpg` },
      { bucket: 'watermarked' as const, path: `${prefix}wm-${photoId}.jpg` },
    ]

    for (const expected of expectedPaths) {
      const found = items.some(
        (entry) => entry.bucket === expected.bucket && entry.path === expected.path
      )
      if (!found) {
        throw new Error('בקשת העלאה לא תקינה')
      }
    }
  }

  return [...photoIds]
}

export function parsePhotoIdsFromUploadRequests(
  userId: string,
  galleryId: string,
  items: R2UploadRequest[]
): string[] {
  const prefix = `${userId}/${galleryId}/`
  const usesOriginals = items.some((item) => item.bucket === 'originals')

  if (usesOriginals) {
    return parseFullPhotoIds(prefix, items)
  }

  return parseDisplayOnlyPhotoIds(prefix, items)
}

export async function assertReservedPhotosExist(
  supabase: AppSupabaseClient,
  galleryId: string,
  photoIds: string[]
) {
  if (photoIds.length === 0) return

  const { data, error } = await supabase
    .from('photos')
    .select('id')
    .eq('gallery_id', galleryId)
    .in('id', photoIds)

  if (error) throw new Error(error.message)

  if ((data ?? []).length !== photoIds.length) {
    throw new Error('תמונות לא נמצאו בגלריה')
  }
}
