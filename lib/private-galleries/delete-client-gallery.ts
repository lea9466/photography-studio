import { createAdminClient } from '@/lib/supabase/admin'
import { isR2Configured } from '@/lib/r2/config'
import { deleteMediaObjects, deleteMediaPrefix } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'

/**
 * Permanently delete ONE client gallery — the end of its 60-day life
 * (docs/private-gallery-lifecycle-plan.md §1.ב). Removes every R2 object plus
 * the `galleries` row; `photos`, `photo_selections`, `edited_photos`,
 * `download_jobs` and `gallery_settings` all cascade off the row
 * (on delete cascade, see 20250614000001_initial_schema.sql).
 * `gallery_pass_credits.consumed_by_gallery_id` is `on delete set null` — a
 * consumed credit stays consumed, it is never refunded.
 *
 * Called from the daily lifecycle cron. Idempotent-ish: a partial failure
 * leaves the row and the cron retries next run.
 */
export async function deleteClientGalleryCompletely(galleryId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: gallery, error: galleryError } = await admin
    .from('galleries')
    .select('id, user_id')
    .eq('id', galleryId)
    .maybeSingle()

  if (galleryError) throw new Error(galleryError.message)
  if (!gallery) return

  const userId = (gallery as { user_id: string }).user_id

  if (isR2Configured()) {
    // Explicit paths first — download-job zips and any edited/photo path that
    // doesn't sit under the canonical `${userId}/${galleryId}/` prefix.
    const [photosResult, editedResult, jobsResult] = await Promise.all([
      admin
        .from('photos')
        .select('original_url, preview_url, watermarked_preview_url')
        .eq('gallery_id', galleryId),
      admin.from('edited_photos').select('final_url').eq('gallery_id', galleryId),
      admin.from('download_jobs').select('file_url').eq('gallery_id', galleryId),
    ])

    const storageDeletes: { bucket: MediaBucket; path: string }[] = []
    for (const row of (photosResult.data ?? []) as {
      original_url: string | null
      preview_url: string | null
      watermarked_preview_url: string | null
    }[]) {
      if (row.original_url) storageDeletes.push({ bucket: 'originals', path: row.original_url })
      if (row.preview_url) storageDeletes.push({ bucket: 'previews', path: row.preview_url })
      if (row.watermarked_preview_url)
        storageDeletes.push({ bucket: 'watermarked', path: row.watermarked_preview_url })
    }
    for (const row of (editedResult.data ?? []) as { final_url: string | null }[]) {
      if (row.final_url) storageDeletes.push({ bucket: 'edited', path: row.final_url })
    }
    for (const row of (jobsResult.data ?? []) as { file_url: string | null }[]) {
      if (row.file_url) storageDeletes.push({ bucket: 'zips', path: row.file_url })
    }

    if (storageDeletes.length > 0) {
      await deleteMediaObjects(storageDeletes)
    }

    // Sweep the whole gallery prefix in each media bucket — catches orphans
    // (a partially-uploaded photo whose row was cleaned up, a renamed key).
    const prefix = `${userId}/${galleryId}/`
    await Promise.all(
      (['originals', 'previews', 'watermarked', 'edited'] as const).map((bucket) =>
        deleteMediaPrefix(bucket, prefix).catch((error) => {
          console.error('[delete-client-gallery] prefix sweep failed', {
            galleryId,
            bucket,
            reason: error instanceof Error ? error.name : 'unknown',
          })
        })
      )
    )
  }

  const { error: deleteError } = await admin.from('galleries').delete().eq('id', galleryId)
  if (deleteError) throw new Error(deleteError.message)
}
