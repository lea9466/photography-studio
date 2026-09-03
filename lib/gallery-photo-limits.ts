import type { createClient } from '@/lib/supabase/server'
import {
  PUBLIC_ONLY_MVP,
  buildPublicGalleryPhotoLimitError,
} from '@/lib/types/app.types'
import type { R2UploadRequest } from '@/lib/r2/types'
import { getPrivateGalleryEntitlements } from '@/lib/private-galleries/loader'

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Temporary, single-account bypass for large-batch upload testing — same
 * pattern as PAYMENTS_SMOKE_TEST_USER_ID in lib/payments/flags.ts. Remove
 * PHOTO_LIMIT_TEST_USER_ID from the environment once testing is done; there
 * is no separate code change needed to turn this back off.
 */
export function isPhotoLimitTestUser(userId: string): boolean {
  const testUserId = process.env.PHOTO_LIMIT_TEST_USER_ID?.trim()
  return Boolean(testUserId) && testUserId === userId
}

export async function getPhotographerPublicPhotoCount(
  supabase: AppSupabaseClient,
  userId: string
): Promise<number> {
  // Always scoped to public galleries — under plain MVP mode every gallery
  // is forced public anyway, so this is a no-op for most accounts, but
  // bypass accounts can have real private galleries whose photos must never
  // count against the *public* gallery quota (see MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER).
  const { data: galleries, error: galleriesError } = await supabase
    .from('galleries')
    .select('id')
    .eq('user_id', userId)
    .eq('is_public', true)
  if (galleriesError) throw new Error(galleriesError.message)

  const galleryIds = ((galleries ?? []) as { id: string }[]).map((gallery) => gallery.id)
  if (galleryIds.length === 0) return 0

  const { count, error } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .in('gallery_id', galleryIds)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function assertGalleryPhotoCountWithinLimit(
  supabase: AppSupabaseClient,
  userId: string,
  isPublic: boolean,
  adding = 0
): Promise<number> {
  if (isPhotoLimitTestUser(userId)) return 0
  if (!isPublic && !PUBLIC_ONLY_MVP) return 0

  const currentCount = await getPhotographerPublicPhotoCount(supabase, userId)
  const limitError = buildPublicGalleryPhotoLimitError(currentCount, adding)
  if (limitError) throw new Error(limitError)

  return currentCount
}

/**
 * Private galleries skip the account-wide public-photo quota entirely. The
 * per-gallery ceiling comes from ONE of two sources, in order:
 *   1. the gallery's own bought gallery pass (`pass_photo_cap`) — a one-time
 *      pay-per-gallery purchase, snapshot at purchase so later catalogue edits
 *      never shrink it (lib/gallery-pass);
 *   2. otherwise the owner's private-gallery tier (lib/private-galleries),
 *      editable live from /manage.
 * Independent of isPhotoLimitTestUser — that flag exists to bypass the *public*
 * quota for large-batch testing, not to exempt anyone from this.
 */
export async function assertPrivateGalleryPhotoCountWithinLimit(
  supabase: AppSupabaseClient,
  galleryId: string,
  ownerId: string,
  adding = 0
): Promise<number> {
  const [{ count, error }, { data: galleryRow }, pg] = await Promise.all([
    supabase.from('photos').select('id', { count: 'exact', head: true }).eq('gallery_id', galleryId),
    supabase.from('galleries').select('pass_photo_cap').eq('id', galleryId).maybeSingle(),
    getPrivateGalleryEntitlements(ownerId),
  ])

  if (error) throw new Error(error.message)

  const currentCount = count ?? 0
  const passCap = (galleryRow as { pass_photo_cap: number | null } | null)?.pass_photo_cap ?? null
  const maxPhotos = passCap ?? pg.limits.maxPhotosPerGallery

  if (currentCount + adding > maxPhotos) {
    throw new Error(
      passCap != null
        ? `הגלריה נרכשה עם מכסה של ${maxPhotos} תמונות — רגילות ומעובדות יחד (יש כרגע ${currentCount})`
        : `ניתן להעלות עד ${maxPhotos} תמונות בגלריה פרטית במסלול הנוכחי — רגילות ומעובדות יחד (יש כרגע ${currentCount})`
    )
  }

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
