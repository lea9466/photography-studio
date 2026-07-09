import type { createClient } from '@/lib/supabase/server'
import type { R2UploadRequest } from '@/lib/r2/types'

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>

export const MAX_POST_PHOTOS = 10

export async function getPostPhotoCount(
  supabase: AppSupabaseClient,
  postId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('post_photos')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export function buildPostPhotoLimitError(
  currentCount: number,
  adding = 0
): string | null {
  const total = currentCount + adding
  if (total <= MAX_POST_PHOTOS) return null
  const remaining = Math.max(0, MAX_POST_PHOTOS - currentCount)
  if (remaining === 0) {
    return `ניתן לקשר עד ${MAX_POST_PHOTOS} תמונות לפוסט`
  }
  return `ניתן להוסיף עוד ${remaining} תמונות בלבד (מקסימום ${MAX_POST_PHOTOS} לפוסט)`
}

export async function assertPostPhotoCountWithinLimit(
  supabase: AppSupabaseClient,
  postId: string,
  adding = 0
): Promise<number> {
  const currentCount = await getPostPhotoCount(supabase, postId)
  const limitError = buildPostPhotoLimitError(currentCount, adding)
  if (limitError) throw new Error(limitError)
  return currentCount
}

const UUID_FILENAME_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jpg$/i

export function parsePostPhotoIdsFromUploadRequests(
  userId: string,
  postId: string,
  items: R2UploadRequest[]
): string[] {
  if (items.length === 0 || items.length % 3 !== 0) {
    throw new Error('בקשת העלאה לא תקינה')
  }

  const prefix = `${userId}/posts/${postId}/`
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
        (entry) =>
          entry.bucket === expected.bucket && entry.path === expected.path
      )
      if (!found) {
        throw new Error('בקשת העלאה לא תקינה')
      }
    }
  }

  return [...photoIds]
}

export async function assertReservedPostPhotosExist(
  supabase: AppSupabaseClient,
  postId: string,
  photoIds: string[]
) {
  if (photoIds.length === 0) return

  const { data, error } = await supabase
    .from('post_photos')
    .select('id')
    .eq('post_id', postId)
    .in('id', photoIds)

  if (error) throw new Error(error.message)

  if ((data ?? []).length !== photoIds.length) {
    throw new Error('תמונות לא נמצאו בפוסט')
  }
}
