'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  clientLogin,
  countAlbumSelectionsByType,
  fetchAlbumByToken,
  fetchAlbumForClient,
  hasSelection,
  imageBelongsToAlbum,
  isAlbumExpired,
  markSelectionsSubmitted,
  saveSelections,
  toggleSelection,
  verifyImageIdsInAlbum,
  type AlbumWithImages,
  type DesiredSelection,
} from '@/lib/client-db'
import {
  clearClientSession,
  createClientSession,
  getClientSession,
} from '@/lib/client-session'
import { getAdminClient } from '@/lib/supabase-admin'
import type { SelectionType } from '@/lib/database.types'
import { submitClientTestimonial } from '@/lib/testimonials-db'
import { tenantPath } from '@/lib/tenant-paths'

export type ClientActionResult = { ok: boolean; message: string }

export async function loginAction(
  photographerSlug: string,
  _prev: ClientActionResult,
  formData: FormData
): Promise<ClientActionResult> {
  if (!getAdminClient()) {
    return { ok: false, message: 'המערכת אינה מוגדרת. פנו לסטודיו.' }
  }

  const email = String(formData.get('email') ?? '')
  const code = String(formData.get('code') ?? '')

  const clientId = await clientLogin(email, code)
  if (!clientId) {
    return { ok: false, message: 'אימייל או קוד גישה שגויים' }
  }

  await createClientSession(clientId)
  redirect(tenantPath(photographerSlug, '/client'))
}

export async function logoutAction(photographerSlug: string): Promise<void> {
  await clearClientSession()
  redirect(tenantPath(photographerSlug, '/client'))
}

export async function submitTestimonialAction(
  photographerSlug: string,
  _prev: ClientActionResult,
  formData: FormData
): Promise<ClientActionResult> {
  const clientId = await getClientSession()
  if (!clientId) {
    return { ok: false, message: 'יש להתחבר מחדש' }
  }

  const content = String(formData.get('content') ?? '')
  const { error } = await submitClientTestimonial(clientId, content)
  if (error) {
    return { ok: false, message: error }
  }

  revalidatePath(tenantPath(photographerSlug, '/client'))
  revalidatePath(tenantPath(photographerSlug))
  return {
    ok: true,
    message: 'ההמלצה נשלחה — תופיע בדף הבית לאחר אישור הסטודיו',
  }
}

export type ToggleResult = {
  ok: boolean
  selected: boolean
  message: string
}

export async function toggleSelectionAction(args: {
  albumId: string
  imageId: string
  type: SelectionType
  token?: string
}): Promise<ToggleResult> {
  const { albumId, imageId, type, token } = args

  if (type !== 'album' && type !== 'edit') {
    return { ok: false, selected: false, message: 'סוג בחירה לא תקין' }
  }

  let clientId: string | null = null
  let album: AlbumWithImages | null = null

  if (token) {
    album = await fetchAlbumByToken(token)
    if (!album || album.id !== albumId) {
      return { ok: false, selected: false, message: 'הקישור אינו תקין' }
    }
    clientId = album.client_id
  } else {
    const sessionClientId = await getClientSession()
    if (!sessionClientId) {
      return { ok: false, selected: false, message: 'יש להתחבר מחדש' }
    }
    album = await fetchAlbumForClient(sessionClientId, albumId)
    if (!album) {
      return { ok: false, selected: false, message: 'הגלריה לא נמצאה' }
    }
    clientId = sessionClientId
  }

  if (isAlbumExpired(album)) {
    return { ok: false, selected: false, message: 'תוקף הגלריה פג' }
  }

  const belongs = await imageBelongsToAlbum(imageId, albumId)
  if (!belongs) {
    return { ok: false, selected: false, message: 'התמונה לא נמצאה' }
  }

  const currentlySelected = await hasSelection(clientId, imageId, type)
  if (!currentlySelected) {
    const max =
      type === 'album' ? album.max_album_selections : album.max_edit_selections
    if (max != null) {
      const count = await countAlbumSelectionsByType(clientId, albumId, type)
      if (count >= max) {
        return {
          ok: false,
          selected: false,
          message: `ניתן לבחור עד ${max} תמונות ${
            type === 'album' ? 'לאלבום' : 'לעיבוד'
          }`,
        }
      }
    }
  }

  const { selected, error } = await toggleSelection(clientId, imageId, type)
  if (error) {
    return { ok: false, selected, message: 'שגיאה בשמירת הבחירה' }
  }

  await markSelectionsSubmitted(albumId)

  return { ok: true, selected, message: '' }
}

export type SaveSelectionsResult = {
  ok: boolean
  message: string
  submittedAt?: string | null
}

/** שמירה מרוכזת של כל הבחירות (כפתור "שמור שינויים") + אכיפת מגבלות. */
export async function saveSelectionsAction(args: {
  albumId: string
  token?: string
  selections: DesiredSelection[]
}): Promise<SaveSelectionsResult> {
  const { albumId, token, selections } = args

  // זיהוי הלקוח + טעינת האלבום עם התמונות והמגבלות
  let clientId: string | null = null
  let album: AlbumWithImages | null = null

  if (token) {
    album = await fetchAlbumByToken(token)
    if (!album || album.id !== albumId) {
      return { ok: false, message: 'הקישור אינו תקין' }
    }
    clientId = album.client_id
  } else {
    const sessionClientId = await getClientSession()
    if (!sessionClientId) {
      return { ok: false, message: 'יש להתחבר מחדש' }
    }
    album = await fetchAlbumForClient(sessionClientId, albumId)
    if (!album) {
      return { ok: false, message: 'הגלריה לא נמצאה' }
    }
    clientId = sessionClientId
  }

  if (isAlbumExpired(album)) {
    return { ok: false, message: 'תוקף הגלריה פג' }
  }

  // ולידציה של הבחירות: סוג תקין + שייכות לאלבום
  let albumCount = 0
  let editCount = 0
  const selectedImageIds: string[] = []
  for (const s of selections) {
    if (s.type !== 'album' && s.type !== 'edit') {
      return { ok: false, message: 'סוג בחירה לא תקין' }
    }
    selectedImageIds.push(s.imageId)
    if (s.type === 'album') albumCount += 1
    else editCount += 1
  }

  if (selectedImageIds.length > 0) {
    const valid = await verifyImageIdsInAlbum(albumId, selectedImageIds)
    if (!valid) {
      return { ok: false, message: 'אחת התמונות אינה שייכת לגלריה' }
    }
  }

  // אכיפת מגבלות
  if (
    album.max_album_selections != null &&
    albumCount > album.max_album_selections
  ) {
    return {
      ok: false,
      message: `ניתן לבחור עד ${album.max_album_selections} תמונות לאלבום`,
    }
  }
  if (
    album.max_edit_selections != null &&
    editCount > album.max_edit_selections
  ) {
    return {
      ok: false,
      message: `ניתן לבחור עד ${album.max_edit_selections} תמונות לעיבוד`,
    }
  }

  const { error } = await saveSelections(clientId, albumId, selections)
  if (error) {
    return { ok: false, message: 'שגיאה בשמירת הבחירות' }
  }

  const submittedAt = await markSelectionsSubmitted(albumId)
  return { ok: true, message: 'הבחירות נשמרו', submittedAt }
}
