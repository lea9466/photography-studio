'use server'

import { revalidatePath } from 'next/cache'
import { deleteMediaObject } from '@/lib/r2/storage'
import type { Database } from '@/lib/types/database.types'
import { assertPostOwner } from '@/lib/auth/post-owner'
import { assertPostPhotoCountWithinLimit } from '@/lib/post-photo-limits'

type PostPhotoInsert = Database['public']['Tables']['post_photos']['Insert']

const COMPLETE_BATCH_SIZE = 50
const DELETE_BATCH_SIZE = 50

export async function reservePostPhotosBatch(postId: string, count: number) {
  const { supabase } = await assertPostOwner(postId)
  if (count <= 0) return []

  await assertPostPhotoCountWithinLimit(supabase, postId, count)

  const { data: lastPhoto } = await supabase
    .from('post_photos')
    .select('sort_order')
    .eq('post_id', postId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const startSortOrder =
    ((lastPhoto as { sort_order: number } | null)?.sort_order ?? -1) + 1

  const payloads: PostPhotoInsert[] = Array.from({ length: count }, (_, index) => ({
    post_id: postId,
    original_url: null,
    preview_url: null,
    watermarked_preview_url: null,
    sort_order: startSortOrder + index,
  }))

  const { data, error } = await supabase
    .from('post_photos')
    .insert(payloads as never)
    .select('id, sort_order')

  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; sort_order: number }[]
}

export async function completePostPhotosBatch(
  postId: string,
  items: {
    id: string
    originalPath?: string | null
    previewPath: string
    watermarkedPath: string
    width?: number | null
    height?: number | null
  }[]
) {
  if (items.length === 0) return

  const { supabase } = await assertPostOwner(postId)

  for (let offset = 0; offset < items.length; offset += COMPLETE_BATCH_SIZE) {
    const chunk = items.slice(offset, offset + COMPLETE_BATCH_SIZE)
    const results = await Promise.all(
      chunk.map((item) =>
        supabase
          .from('post_photos')
          .update({
            original_url: item.originalPath ?? null,
            preview_url: item.previewPath,
            watermarked_preview_url: item.watermarkedPath,
            ...(item.width != null && item.height != null
              ? { width: item.width, height: item.height }
              : {}),
          } as never)
          .eq('id', item.id)
          .eq('post_id', postId)
      )
    )

    const failed = results.find((result) => result.error)
    if (failed?.error) throw new Error(failed.error.message)
  }
}

export async function cleanupPostPhotosBatch(
  postId: string,
  photoIds: string[],
  storagePaths: {
    originalPath?: string | null
    previewPath?: string | null
    watermarkedPath?: string | null
  }[]
) {
  if (photoIds.length === 0) return

  const { supabase } = await assertPostOwner(postId)

  for (const paths of storagePaths) {
    const removals = [
      paths.originalPath
        ? { bucket: 'originals' as const, path: paths.originalPath }
        : null,
      { bucket: 'previews' as const, path: paths.previewPath },
      { bucket: 'watermarked' as const, path: paths.watermarkedPath },
    ].filter((entry): entry is { bucket: 'originals' | 'previews' | 'watermarked'; path: string } =>
      Boolean(entry?.path)
    )

    for (const { bucket, path } of removals) {
      try {
        await deleteMediaObject(bucket, path)
      } catch {
        // Best-effort cleanup for partial uploads.
      }
    }
  }

  const { error } = await supabase
    .from('post_photos')
    .delete()
    .eq('post_id', postId)
    .in('id', photoIds)

  if (error) throw new Error(error.message)
}

export async function finalizePostUpload(postId: string) {
  await assertPostOwner(postId)
  revalidatePath('/dashboard/posts')
  revalidatePath('/[slug]/blog', 'page')
}

export async function deletePostPhotosBulk(postId: string, photoIds: string[]) {
  if (photoIds.length === 0) return { deleted: 0 }

  const { supabase } = await assertPostOwner(postId)

  const { data: photos, error: fetchError } = await supabase
    .from('post_photos')
    .select('id, original_url, preview_url, watermarked_preview_url')
    .eq('post_id', postId)
    .in('id', photoIds)

  if (fetchError) throw new Error(fetchError.message)

  type PhotoRow = {
    id: string
    original_url: string | null
    preview_url: string | null
    watermarked_preview_url: string | null
  }

  const rows = (photos ?? []) as PhotoRow[]
  if (rows.length === 0) return { deleted: 0 }

  const ids = rows.map((row) => row.id)

  for (let offset = 0; offset < rows.length; offset += DELETE_BATCH_SIZE) {
    const chunk = rows.slice(offset, offset + DELETE_BATCH_SIZE)
    for (const row of chunk) {
      const removals = [
        { bucket: 'originals' as const, path: row.original_url },
        { bucket: 'previews' as const, path: row.preview_url },
        { bucket: 'watermarked' as const, path: row.watermarked_preview_url },
      ].filter((entry) => entry.path)

      for (const { bucket, path } of removals) {
        await deleteMediaObject(bucket, path!)
      }
    }
  }

  const { error } = await supabase
    .from('post_photos')
    .delete()
    .eq('post_id', postId)
    .in('id', ids)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/posts')
  revalidatePath('/[slug]/blog', 'page')
  return { deleted: ids.length }
}

export async function fetchPostPhotos(postId: string) {
  const { supabase } = await assertPostOwner(postId)

  const { data, error } = await supabase
    .from('post_photos')
    .select('*')
    .eq('post_id', postId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
