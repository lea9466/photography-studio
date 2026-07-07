'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteMediaObject, resolveMediaUrl } from '@/lib/r2/storage'
import { signStoragePaths } from '@/lib/storage'
import type { MediaBucket } from '@/lib/r2/types'
import type { Database } from '@/lib/types/database.types'
import { PUBLIC_ONLY_MVP } from '@/lib/types/app.types'
import { assertGalleryPhotoCountWithinLimit } from '@/lib/gallery-photo-limits'

type PhotoInsert = Database['public']['Tables']['photos']['Insert']

const COMPLETE_BATCH_SIZE = 50
const DELETE_BATCH_SIZE = 50

import { assertGalleryOwner, assertPhotoInOwnedGallery } from '@/lib/auth/gallery-owner'

export async function reservePhotosBatch(galleryId: string, count: number, isProcessed = false) {
  console.log('👉 1. reservePhotosBatch START', { galleryId, count, isProcessed })
  const { supabase, gallery } = await assertGalleryOwner(galleryId)
  console.log('👉 2. assertGalleryOwner done')
  if (count <= 0) {
    console.log('👉 3. count <= 0, returning early')
    return []
  }

  if (gallery.is_public || PUBLIC_ONLY_MVP) {
    await assertGalleryPhotoCountWithinLimit(
      supabase,
      galleryId,
      gallery.is_public,
      count
    )
  }

  console.log('👉 4. About to query last photo')
  const { data: lastPhoto } = await supabase
    .from('photos')
    .select('sort_order')
    .eq('gallery_id', galleryId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  console.log('👉 5. Last photo query done')

  const startSortOrder =
    ((lastPhoto as { sort_order: number } | null)?.sort_order ?? -1) + 1

  const payloads: PhotoInsert[] = Array.from({ length: count }, (_, index) => ({
    gallery_id: galleryId,
    original_url: null,
    preview_url: null,
    watermarked_preview_url: null,
    sort_order: startSortOrder + index,
    is_processed: isProcessed,
  }))

  console.log('👉 6. About to insert photos batch', { isProcessed, samplePayload: payloads[0] })
  const { data, error } = await supabase
    .from('photos')
    .insert(payloads as never)
    .select('id, sort_order, is_processed')
  console.log('👉 7. Photos batch insert done', { error, dataLength: data?.length, sampleData: data?.[0] })

  if (error) throw new Error(error.message)
  console.log('👉 8. reservePhotosBatch COMPLETE')
  return (data ?? []) as { id: string; sort_order: number }[]
}

export async function completePhotosBatch(
  galleryId: string,
  items: {
    id: string
    originalPath: string
    previewPath: string
    watermarkedPath: string
    width?: number | null
    height?: number | null
  }[],
  isProcessed = false
) {
  console.log('👉 20. completePhotosBatch START', { galleryId, itemCount: items.length, isProcessed })
  if (items.length === 0) {
    console.log('👉 21. No items to complete, returning early')
    return
  }

  const { supabase } = await assertGalleryOwner(galleryId)
  console.log('👉 22. assertGalleryOwner done for completePhotosBatch')

  for (let offset = 0; offset < items.length; offset += COMPLETE_BATCH_SIZE) {
    console.log('👉 23. Processing batch', { offset, batchSize: COMPLETE_BATCH_SIZE, isProcessed })
    const chunk = items.slice(offset, offset + COMPLETE_BATCH_SIZE)
    console.log('👉 24. About to update photos in database')
    const results = await Promise.all(
      chunk.map((item) =>
        supabase
          .from('photos')
          .update({
            original_url: item.originalPath,
            preview_url: item.previewPath,
            watermarked_preview_url: item.watermarkedPath,
            is_processed: isProcessed,
            ...(item.width != null && item.height != null
              ? { width: item.width, height: item.height }
              : {}),
          } as never)
          .eq('id', item.id)
          .eq('gallery_id', galleryId)
      )
    )
    console.log('👉 25. Database update done', { resultCount: results.length, isProcessed })

    const failed = results.find((result) => result.error)
    if (failed?.error) {
      console.log('👉 26. ERROR in database update', { error: failed.error.message })
      throw new Error(failed.error.message)
    }
  }
  console.log('👉 27. completePhotosBatch COMPLETE')
}

export async function cleanupPhotosBatch(
  galleryId: string,
  photoIds: string[],
  storagePaths: {
    originalPath?: string | null
    previewPath?: string | null
    watermarkedPath?: string | null
  }[]
) {
  if (photoIds.length === 0) return

  const { supabase } = await assertGalleryOwner(galleryId)

  for (const paths of storagePaths) {
    const removals = [
      { bucket: 'originals' as const, path: paths.originalPath },
      { bucket: 'previews' as const, path: paths.previewPath },
      { bucket: 'watermarked' as const, path: paths.watermarkedPath },
    ].filter((entry) => entry.path)

    for (const { bucket, path } of removals) {
      await deleteMediaObject(bucket, path!)
    }
  }

  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('gallery_id', galleryId)
    .in('id', photoIds)

  if (error) throw new Error(error.message)
}

export async function finalizeGalleryUpload(galleryId: string) {
  console.log('👉 30. finalizeGalleryUpload START', { galleryId })
  await assertGalleryOwner(galleryId)
  console.log('👉 31. assertGalleryOwner done for finalizeGalleryUpload')
  console.log('👉 32. About to revalidate paths')
  revalidatePath(`/dashboard/galleries/${galleryId}`)
  revalidatePath(`/dashboard/galleries/${galleryId}/photos`)
  revalidatePath('/dashboard')
  console.log('👉 33. finalizeGalleryUpload COMPLETE')
}

export async function registerPhoto(input: {
  galleryId: string
  originalPath: string
  previewPath: string
  watermarkedPath: string
  sortOrder?: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const { data: gallery } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', input.galleryId)
    .eq('user_id', user.id)
    .single()

  if (!gallery) throw new Error('גלריה לא נמצאה')

  const payload: PhotoInsert = {
    gallery_id: input.galleryId,
    original_url: input.originalPath,
    preview_url: input.previewPath,
    watermarked_preview_url: input.watermarkedPath,
    sort_order: input.sortOrder ?? 0,
  }

  const { data, error } = await supabase
    .from('photos')
    .insert(payload as never)
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/galleries/${input.galleryId}`)
  revalidatePath('/dashboard')

  return { id: (data as { id: string }).id }
}

export async function setPhotosVisibilityBulk(
  galleryId: string,
  photoIds: string[],
  visible: boolean
) {
  if (photoIds.length === 0) return

  const { supabase } = await assertGalleryOwner(galleryId)

  const { error } = await supabase
    .from('photos')
    .update({ is_visible_to_client: visible } as never)
    .eq('gallery_id', galleryId)
    .in('id', photoIds)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/galleries/${galleryId}/photos`)
  revalidatePath(`/g/${galleryId}`)
}

export async function setPhotosProcessedBulk(
  galleryId: string,
  photoIds: string[],
  processed: boolean
) {
  if (photoIds.length === 0) return

  const { supabase } = await assertGalleryOwner(galleryId)

  const { error } = await supabase
    .from('photos')
    .update({ is_processed: processed } as never)
    .eq('gallery_id', galleryId)
    .in('id', photoIds)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/galleries/${galleryId}/photos`)
  revalidatePath(`/dashboard/galleries/${galleryId}`)
}

export async function signPreviewUrls(previewUrls: (string | null)[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('יש להתחבר מחדש')

  const filteredUrls = previewUrls.filter((url): url is string => url !== null)
  if (filteredUrls.length === 0) {
    return {}
  }

  const prefix = `${user.id}/`
  for (const url of filteredUrls) {
    if (!url.startsWith(prefix)) {
      throw new Error('נתיב קובץ לא תקין')
    }
  }

  return signStoragePaths('previews', filteredUrls)
}

export async function prepareGalleryForDelivery(galleryId: string) {
  const { supabase } = await assertGalleryOwner(galleryId)

  // Ensure all photos are visible to client
  const { error } = await supabase
    .from('photos')
    .update({ is_visible_to_client: true } as never)
    .eq('gallery_id', galleryId)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/galleries/${galleryId}/photos`)
  revalidatePath(`/g/${galleryId}`)
}

export async function togglePhotoVisibility(photoId: string, visible: boolean) {
  const { supabase, photo } = await assertPhotoInOwnedGallery(photoId)

  const { error } = await supabase
    .from('photos')
    .update({ is_visible_to_client: visible } as never)
    .eq('id', photoId)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/galleries/${photo.gallery_id}`)
}

export async function deletePhotosBulk(galleryId: string, photoIds: string[]) {
  if (photoIds.length === 0) return { deleted: 0 }

  const { supabase } = await assertGalleryOwner(galleryId)

  const { data: photos, error: fetchError } = await supabase
    .from('photos')
    .select('id, original_url, preview_url, watermarked_preview_url')
    .eq('gallery_id', galleryId)
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

  const { data: edited, error: editedError } = await supabase
    .from('edited_photos')
    .select('photo_id, final_url')
    .eq('gallery_id', galleryId)
    .in('photo_id', ids)

  if (editedError) throw new Error(editedError.message)

  const editedByPhoto = new Map(
    ((edited ?? []) as { photo_id: string; final_url: string | null }[]).map(
      (row) => [row.photo_id, row.final_url]
    )
  )

  const storageDeletes: { bucket: MediaBucket; path: string }[] = []
  for (const row of rows) {
    if (row.original_url) {
      storageDeletes.push({ bucket: 'originals', path: row.original_url })
    }
    if (row.preview_url) {
      storageDeletes.push({ bucket: 'previews', path: row.preview_url })
    }
    if (row.watermarked_preview_url) {
      storageDeletes.push({
        bucket: 'watermarked',
        path: row.watermarked_preview_url,
      })
    }
    const editedPath = editedByPhoto.get(row.id)
    if (editedPath) {
      storageDeletes.push({ bucket: 'edited', path: editedPath })
    }
  }

  for (let offset = 0; offset < storageDeletes.length; offset += DELETE_BATCH_SIZE) {
    const chunk = storageDeletes.slice(offset, offset + DELETE_BATCH_SIZE)
    await Promise.all(
      chunk.map(({ bucket, path }) => deleteMediaObject(bucket, path))
    )
  }

  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('gallery_id', galleryId)
    .in('id', ids)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/galleries/${galleryId}/photos`)
  revalidatePath(`/dashboard/galleries/${galleryId}`)
  revalidatePath(`/g/${galleryId}`)
  revalidatePath('/dashboard')

  return { deleted: ids.length }
}

export async function deletePhoto(photoId: string) {
  const { supabase, photo } = await assertPhotoInOwnedGallery(photoId)

  const paths = [
    { bucket: 'originals' as const, path: photo.original_url },
    { bucket: 'previews' as const, path: photo.preview_url },
    { bucket: 'watermarked' as const, path: photo.watermarked_preview_url },
  ].filter((p) => p.path)

  for (const { bucket, path } of paths) {
    await deleteMediaObject(bucket, path!)
  }

  const { error } = await supabase.from('photos').delete().eq('id', photoId)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/galleries/${photo.gallery_id}`)
  revalidatePath('/dashboard')
}

export async function getSignedPhotoUrl(
  bucket: MediaBucket,
  path: string,
  galleryId?: string
) {
  if (!path) throw new Error('לא ניתן ליצור קישור לתמונה')

  const sensitiveBuckets: MediaBucket[] = ['originals', 'edited', 'zips']
  if (sensitiveBuckets.includes(bucket)) {
    if (!galleryId) throw new Error('גישה נדחתה')

    const { user } = await assertGalleryOwner(galleryId)
    const prefix = `${user.id}/${galleryId}/`
    if (!path.startsWith(prefix)) {
      throw new Error('נתיב קובץ לא תקין')
    }
  } else {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('יש להתחבר מחדש')
    if (!path.startsWith(`${user.id}/`)) {
      throw new Error('נתיב קובץ לא תקין')
    }
  }

  const url = await resolveMediaUrl(bucket, path, galleryId)
  if (!url) throw new Error('לא ניתן ליצור קישור לתמונה')
  return url
}

export async function registerEditedPhoto(input: {
  galleryId: string
  photoId: string
  editedPath: string
}) {
  await assertGalleryOwner(input.galleryId)
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('edited_photos')
    .select('id')
    .eq('photo_id', input.photoId)
    .eq('gallery_id', input.galleryId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('edited_photos')
      .update({ final_url: input.editedPath } as never)
      .eq('photo_id', input.photoId)
      .eq('gallery_id', input.galleryId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('edited_photos').insert({
      gallery_id: input.galleryId,
      photo_id: input.photoId,
      final_url: input.editedPath,
    } as never)
    if (error) throw new Error(error.message)
  }

  revalidatePath(`/dashboard/galleries/${input.galleryId}`)
}

export async function registerEditedPhotosBatch(input: {
  galleryId: string
  items: { photoId: string; editedPath: string }[]
}) {
  if (input.items.length === 0) return { uploaded: 0 }

  await assertGalleryOwner(input.galleryId)
  const supabase = await createClient()

  for (const item of input.items) {
    const { data: existing } = await supabase
      .from('edited_photos')
      .select('id')
      .eq('photo_id', item.photoId)
      .eq('gallery_id', input.galleryId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('edited_photos')
        .update({ final_url: item.editedPath } as never)
        .eq('photo_id', item.photoId)
        .eq('gallery_id', input.galleryId)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('edited_photos').insert({
        gallery_id: input.galleryId,
        photo_id: item.photoId,
        final_url: item.editedPath,
      } as never)
      if (error) throw new Error(error.message)
    }
  }

  await prepareGalleryForDelivery(input.galleryId)

  revalidatePath(`/dashboard/galleries/${input.galleryId}`)
  revalidatePath(`/dashboard/galleries/${input.galleryId}/selections`)
  revalidatePath(`/g/${input.galleryId}`)

  return { uploaded: input.items.length }
}

export async function fetchGalleryPhotos(galleryId: string) {
  const { supabase } = await assertGalleryOwner(galleryId)
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export type GallerySelectionPhoto = {
  id: string
  preview_url: string | null
  preview_signed_url: string | null
  edited_signed_url: string | null
  selected_album: boolean
  selected_edit: boolean
}

export async function fetchGallerySelections(galleryId: string) {
  await assertGalleryOwner(galleryId)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('photos')
    .select(
      `
      id, preview_url,
      photo_selections (selected_album, selected_edit),
      edited_photos (final_url)
    `
    )
    .eq('gallery_id', galleryId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  type Row = {
    id: string
    preview_url: string | null
    photo_selections:
      | { selected_album: boolean; selected_edit: boolean }
      | { selected_album: boolean; selected_edit: boolean }[]
      | null
    edited_photos:
      | { final_url: string | null }
      | { final_url: string | null }[]
      | null
  }

  const mapped = await Promise.all(
    ((data ?? []) as Row[]).map(async (photo) => {
      const selection = Array.isArray(photo.photo_selections)
        ? photo.photo_selections[0]
        : photo.photo_selections
      const edited = Array.isArray(photo.edited_photos)
        ? photo.edited_photos[0]
        : photo.edited_photos

      return {
        id: photo.id,
        preview_url: photo.preview_url,
        preview_signed_url: await resolveMediaUrl('previews', photo.preview_url),
        edited_signed_url: await resolveMediaUrl('edited', edited?.final_url ?? null),
        selected_album: selection?.selected_album ?? false,
        selected_edit: selection?.selected_edit ?? false,
      } satisfies GallerySelectionPhoto
    })
  )

  return {
    albumPhotos: mapped.filter((photo) => photo.selected_album),
    editPhotos: mapped.filter((photo) => photo.selected_edit),
  }
}
