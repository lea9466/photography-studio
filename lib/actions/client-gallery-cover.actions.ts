'use server'

import { revalidatePath } from 'next/cache'
import { assertGalleryOwner } from '@/lib/auth/gallery-owner'
import { galleryKind } from '@/lib/gallery-kind'
import { isR2Configured } from '@/lib/r2/config'
import {
  createPresignedUploadUrl,
  deleteMediaObject,
  mediaObjectExists,
} from '@/lib/r2/storage'
import {
  buildClientCoverPath,
  CLIENT_COVER_MAX_BYTES,
  isClientCoverPath,
} from '@/lib/private-galleries/client-cover'

/**
 * Result of a cover action. Errors are *returned*, not thrown: Next.js swaps a
 * thrown Server Action message for a generic string in production, so a thrown
 * Hebrew message would never reach the photographer.
 */
export type ClientCoverResult<T = Record<never, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string }

const GALLERY_NOT_FOUND = 'הגלריה לא נמצאה'

/** Ownership + kind check shared by every cover action. */
async function requireOwnedClientGallery(galleryId: string) {
  let owned
  try {
    owned = await assertGalleryOwner(galleryId)
  } catch {
    return null
  }
  if (galleryKind(owned.gallery) !== 'client') return null
  return owned
}

async function readCurrentCover(
  supabase: Awaited<ReturnType<typeof assertGalleryOwner>>['supabase'],
  galleryId: string,
  userId: string
) {
  const { data } = await supabase
    .from('galleries')
    .select('cover_image')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data as { cover_image: string | null } | null)?.cover_image ?? null
}

/** Best-effort removal of a replaced/removed cover file — never fails the action. */
async function deleteCoverObject(path: string) {
  try {
    await deleteMediaObject('previews', path)
  } catch (error) {
    console.error('[client-cover] failed to delete cover object', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
  }
}

/**
 * Step 1 of a cover upload: hands the browser a presigned PUT for a new,
 * generated path inside the gallery's own prefix. The cover is not attached to
 * the gallery until `saveClientGalleryCover` confirms the object arrived.
 */
export async function prepareClientGalleryCoverUpload(
  galleryId: string,
  input: { contentType: string; fileSize: number }
): Promise<ClientCoverResult<{ uploadUrl: string; path: string }>> {
  if (!isR2Configured()) return { ok: false, error: 'אחסון תמונות לא מוגדר' }

  const owned = await requireOwnedClientGallery(galleryId)
  if (!owned) return { ok: false, error: GALLERY_NOT_FOUND }

  // The browser always compresses to JPEG before uploading; nothing else is accepted.
  if (input.contentType !== 'image/jpeg') {
    return { ok: false, error: 'סוג הקובץ לא נתמך' }
  }
  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    return { ok: false, error: 'הקובץ ריק' }
  }
  if (input.fileSize > CLIENT_COVER_MAX_BYTES) {
    return { ok: false, error: 'התמונה גדולה מדי — נסי תמונה קטנה יותר' }
  }

  const path = buildClientCoverPath(owned.user.id, galleryId)
  const uploadUrl = await createPresignedUploadUrl('previews', path, 'image/jpeg')
  return { ok: true, uploadUrl, path }
}

/**
 * Step 2: attaches an uploaded cover to the gallery and removes the one it
 * replaces. The path must be one this gallery's owner could have been handed
 * by `prepareClientGalleryCoverUpload`, and the object must actually exist.
 */
export async function saveClientGalleryCover(
  galleryId: string,
  path: string
): Promise<ClientCoverResult<{ path: string }>> {
  const owned = await requireOwnedClientGallery(galleryId)
  if (!owned) return { ok: false, error: GALLERY_NOT_FOUND }

  const { supabase, user } = owned
  if (!isClientCoverPath(path, user.id, galleryId)) {
    return { ok: false, error: 'נתיב תמונת הכיסוי לא תקין' }
  }
  if (!(await mediaObjectExists('previews', path))) {
    return { ok: false, error: 'ההעלאה לא הושלמה — נסי שוב' }
  }

  const previous = await readCurrentCover(supabase, galleryId, user.id)

  const { error } = await supabase
    .from('galleries')
    .update({ cover_image: path } as never)
    .eq('id', galleryId)
    .eq('user_id', user.id)
  if (error) {
    console.error('[client-cover] save failed', { galleryId, code: error.code })
    return { ok: false, error: 'שמירת תמונת הכיסוי נכשלה' }
  }

  if (previous && previous !== path && isClientCoverPath(previous, user.id, galleryId)) {
    await deleteCoverObject(previous)
  }

  revalidatePath(`/dashboard/galleries/${galleryId}`)
  return { ok: true, path }
}

export async function removeClientGalleryCover(
  galleryId: string
): Promise<ClientCoverResult> {
  const owned = await requireOwnedClientGallery(galleryId)
  if (!owned) return { ok: false, error: GALLERY_NOT_FOUND }

  const { supabase, user } = owned
  const previous = await readCurrentCover(supabase, galleryId, user.id)

  const { error } = await supabase
    .from('galleries')
    .update({ cover_image: null } as never)
    .eq('id', galleryId)
    .eq('user_id', user.id)
  if (error) {
    console.error('[client-cover] remove failed', { galleryId, code: error.code })
    return { ok: false, error: 'הסרת תמונת הכיסוי נכשלה' }
  }

  if (isClientCoverPath(previous, user.id, galleryId)) {
    await deleteCoverObject(previous)
  }

  revalidatePath(`/dashboard/galleries/${galleryId}`)
  return { ok: true }
}
