'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { deleteMediaObject } from '@/lib/r2/storage'
import { buildPhotoStoragePaths } from '@/lib/images/process'

const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000

type OrphanedPhotoRow = {
  id: string
  gallery_id: string
  galleries: { user_id: string } | { user_id: string }[] | null
}

export async function cleanupOrphanedPhotos() {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - ORPHAN_AGE_MS).toISOString()

  const { data, error } = await supabase
    .from('photos')
    .select('id, gallery_id, galleries!inner(user_id)')
    .is('original_url', null)
    .lt('created_at', cutoff)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as OrphanedPhotoRow[]
  if (rows.length === 0) {
    return { deleted: 0, storageCleaned: 0 }
  }

  let storageCleaned = 0

  for (const row of rows) {
    const gallery = Array.isArray(row.galleries)
      ? row.galleries[0]
      : row.galleries
    if (!gallery?.user_id) continue

    const paths = buildPhotoStoragePaths(
      gallery.user_id,
      row.gallery_id,
      row.id
    )

    const removals = [
      { bucket: 'originals' as const, path: paths.originalPath },
      { bucket: 'previews' as const, path: paths.previewPath },
      { bucket: 'watermarked' as const, path: paths.watermarkedPath },
    ]

    for (const { bucket, path } of removals) {
      try {
        await deleteMediaObject(bucket, path)
        storageCleaned += 1
      } catch {
        // Best-effort — file may never have been uploaded.
      }
    }
  }

  const ids = rows.map((row) => row.id)
  const { error: deleteError } = await supabase
    .from('photos')
    .delete()
    .in('id', ids)

  if (deleteError) throw new Error(deleteError.message)

  return { deleted: ids.length, storageCleaned }
}
