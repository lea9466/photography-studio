'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  hasGallerySession,
  setGallerySession,
} from '@/lib/gallery-session'
import { prepareGalleryForDelivery } from '@/lib/actions/photo.actions'
import {
  sendGalleryPasswordEmail,
  sendSelectionDoneEmail,
  sendDeliveryReadyEmail,
} from '@/lib/email/resend'
import { getEmailHint, type EmailHint } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'
import type { GalleryStatus } from '@/lib/types/database.types'
import {
  countSelections,
  validateSelectionLimits,
  type ClientSelectionPayload,
} from '@/lib/gallery-selection'

export type ClientGalleryPhoto = {
  id: string
  preview_url: string | null
  watermarked_preview_url: string | null
  is_visible_to_client: boolean
  selected_album: boolean
  selected_edit: boolean
  edited_url: string | null
  preview_signed_url: string | null
  lightbox_signed_url: string | null
  edited_signed_url: string | null
}

export type ClientGalleryData = {
  id: string
  title: string
  status: GalleryStatus
  gallery_type: string
  studio_name: string | null
  logo_url: string | null
  accent_color: string
  selected_theme: string
  hero_desktop_url: string | null
  hero_mobile_url: string | null
  about_text: string | null
  about_image_url: string | null
  stat_projects: number
  stat_clients: number
  stat_experience_years: number
  max_album_selection: number | null
  max_edit_selection: number | null
  allow_download_preview: boolean
  allow_download_original: boolean
}

async function signPath(bucket: MediaBucket, path: string | null) {
  return resolveMediaUrl(bucket, path)
}

export async function getClientGalleryPublicMeta(galleryId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('galleries')
    .select('id, title, status, gallery_type, users(studio_name), clients(email)')
    .eq('id', galleryId)
    .single()

  type Row = {
    id: string
    title: string
    status: GalleryStatus
    gallery_type: string
    users: { studio_name: string | null } | { studio_name: string | null }[] | null
    clients: { email: string | null } | { email: string | null }[] | null
  }

  const gallery = data as Row | null
  if (!gallery) return null
  if (gallery.gallery_type === 'portfolio') return null

  const user = Array.isArray(gallery.users) ? gallery.users[0] : gallery.users
  const client = Array.isArray(gallery.clients) ? gallery.clients[0] : gallery.clients
  const emailHint = client?.email ? getEmailHint(client.email) : null

  return {
    id: gallery.id,
    title: gallery.title,
    status: gallery.status,
    studio_name: user?.studio_name ?? null,
    emailHint,
  }
}

export async function requestGalleryPassword(galleryId: string) {
  const admin = createAdminClient()

  const { data } = await admin
    .from('galleries')
    .select(
      `
      id, title, password, expires_at, status,
      clients (name, email),
      users (studio_name)
    `
    )
    .eq('id', galleryId)
    .single()

  type GalleryRow = {
    id: string
    title: string
    password: string | null
    expires_at: string | null
    status: GalleryStatus
    clients: { name: string; email: string | null } | { name: string; email: string | null }[] | null
    users: { studio_name: string | null } | { studio_name: string | null }[] | null
  }

  const gallery = data as GalleryRow | null
  if (!gallery) throw new Error('גלריה לא נמצאה')
  if (gallery.status === 'draft') throw new Error('הגלריה עדיין לא נשלחה')
  if (gallery.status === 'locked') throw new Error('הגלריה סגורה')
  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    throw new Error('פג תוקף הגלריה')
  }

  const client = Array.isArray(gallery.clients) ? gallery.clients[0] : gallery.clients
  if (!client?.email) {
    throw new Error('לא נמצא מייל ללקוח — פנו לצלם/ת')
  }
  if (!gallery.password) {
    throw new Error('לא הוגדרה סיסמה לגלריה')
  }

  const profile = Array.isArray(gallery.users) ? gallery.users[0] : gallery.users
  const emailHint = getEmailHint(client.email)

  await sendGalleryPasswordEmail({
    galleryId: gallery.id,
    galleryTitle: gallery.title,
    clientEmail: client.email,
    clientName: client.name,
    studioName: profile?.studio_name ?? 'Studio Gallery',
    password: gallery.password,
  })

  return {
    success: true,
    emailHint: emailHint as EmailHint,
  }
}

export async function verifyGalleryPassword(galleryId: string, password: string) {
  const admin = createAdminClient()

  const { data } = await admin
    .from('galleries')
    .select('id, password, expires_at, status')
    .eq('id', galleryId)
    .single()

  type GalleryRow = {
    id: string
    password: string | null
    expires_at: string | null
    status: GalleryStatus
  }

  const gallery = data as GalleryRow | null
  if (!gallery) throw new Error('גלריה לא נמצאה')
  if (gallery.status === 'locked') throw new Error('הגלריה סגורה')
  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    throw new Error('פג תוקף הגלריה')
  }
  if (gallery.password !== password.trim()) {
    throw new Error('סיסמה שגויה')
  }

  await setGallerySession(galleryId)
  return { success: true }
}

export async function getClientGallery(galleryId: string) {
  const allowed = await hasGallerySession(galleryId)
  if (!allowed) return null

  const admin = createAdminClient()

  const { data: galleryData } = await admin
    .from('galleries')
    .select(
      `
      id, title, status, gallery_type, user_id,
      users (studio_name, logo_url),
      gallery_settings (
        max_album_selection, max_edit_selection,
        allow_download_preview, allow_download_original
      )
    `
    )
    .eq('id', galleryId)
    .single()

  if (!galleryData) return null

  type GalleryDetail = {
    id: string
    title: string
    status: GalleryStatus
    gallery_type: string
    users: { studio_name: string | null; logo_url: string | null } | { studio_name: string | null; logo_url: string | null }[] | null
    gallery_settings: {
      max_album_selection: number | null
      max_edit_selection: number | null
      allow_download_preview: boolean
      allow_download_original: boolean
    } | { max_album_selection: number | null; max_edit_selection: number | null; allow_download_preview: boolean; allow_download_original: boolean }[] | null
  }

  const gallery = galleryData as GalleryDetail
  const user = Array.isArray(gallery.users) ? gallery.users[0] : gallery.users
  const settings = Array.isArray(gallery.gallery_settings)
    ? gallery.gallery_settings[0]
    : gallery.gallery_settings

  const { data: photos } = await admin
    .from('photos')
    .select(
      `
      id, preview_url, watermarked_preview_url, is_visible_to_client,
      photo_selections (selected_album, selected_edit),
      edited_photos (final_url)
    `
    )
    .eq('gallery_id', galleryId)
    .eq('is_visible_to_client', true)
    .order('sort_order', { ascending: true })

  type PhotoRow = {
    id: string
    preview_url: string | null
    watermarked_preview_url: string | null
    is_visible_to_client: boolean
    photo_selections: { selected_album: boolean; selected_edit: boolean } | { selected_album: boolean; selected_edit: boolean }[] | null
    edited_photos: { final_url: string | null } | { final_url: string | null }[] | null
  }

  const useWatermarked = !['delivery_ready', 'locked'].includes(gallery.status)
  const isDelivered = !useWatermarked

  const clientPhotos: ClientGalleryPhoto[] = await Promise.all(
    ((photos ?? []) as PhotoRow[]).map(async (photo) => {
      const selection = Array.isArray(photo.photo_selections)
        ? photo.photo_selections[0]
        : photo.photo_selections
      const edited = Array.isArray(photo.edited_photos)
        ? photo.edited_photos[0]
        : photo.edited_photos

      const editedPath = edited?.final_url ?? null
      const lightboxPath = useWatermarked
        ? photo.watermarked_preview_url
        : editedPath ?? photo.preview_url

      const gridPath =
        isDelivered && editedPath
          ? editedPath
          : useWatermarked && photo.watermarked_preview_url
            ? photo.watermarked_preview_url
            : photo.preview_url
      const gridBucket: MediaBucket =
        isDelivered && editedPath
          ? 'edited'
          : useWatermarked && photo.watermarked_preview_url
            ? 'watermarked'
            : 'previews'

      return {
        id: photo.id,
        preview_url: photo.preview_url,
        watermarked_preview_url: photo.watermarked_preview_url,
        is_visible_to_client: photo.is_visible_to_client,
        selected_album: selection?.selected_album ?? false,
        selected_edit: selection?.selected_edit ?? false,
        edited_url: editedPath,
        preview_signed_url: await signPath(gridBucket, gridPath),
        lightbox_signed_url: await signPath(
          isDelivered && editedPath ? 'edited' : useWatermarked ? 'watermarked' : 'previews',
          lightboxPath
        ),
        edited_signed_url: await signPath('edited', editedPath),
      }
    })
  )

  const meta: ClientGalleryData = {
    id: gallery.id,
    title: gallery.title,
    status: gallery.status,
    gallery_type: gallery.gallery_type,
    studio_name: user?.studio_name ?? null,
    logo_url: user?.logo_url ?? null,
    accent_color: (user as any)?.accent_color ?? '#7c3aed',
    selected_theme: (user as any)?.selected_theme ?? 'classic',
    hero_desktop_url: (user as any)?.hero_desktop_url ?? null,
    hero_mobile_url: (user as any)?.hero_mobile_url ?? null,
    about_text: (user as any)?.about_text ?? null,
    about_image_url: (user as any)?.about_image_url ?? null,
    stat_projects: (user as any)?.stat_projects ?? 0,
    stat_clients: (user as any)?.stat_clients ?? 0,
    stat_experience_years: (user as any)?.stat_experience_years ?? 0,
    max_album_selection: settings?.max_album_selection ?? null,
    max_edit_selection: settings?.max_edit_selection ?? null,
    allow_download_preview: settings?.allow_download_preview ?? false,
    allow_download_original: settings?.allow_download_original ?? false,
  }

  return { gallery: meta, photos: clientPhotos }
}

export async function completeClientSelection(
  galleryId: string,
  selections: ClientSelectionPayload[]
) {
  const allowed = await hasGallerySession(galleryId)
  if (!allowed) throw new Error('גישה נדחתה')

  const admin = createAdminClient()

  const { data: galleryData } = await admin
    .from('galleries')
    .select('id, title, status, user_id, clients(name, email)')
    .eq('id', galleryId)
    .single()

  type GalleryWithClient = {
    id: string
    title: string
    status: GalleryStatus
    user_id: string
    clients: { name: string; email: string | null } | { name: string; email: string | null }[] | null
  }

  const gallery = galleryData as GalleryWithClient | null
  if (!gallery) throw new Error('גלריה לא נמצאה')
  if (!['selection'].includes(gallery.status)) {
    throw new Error('הבחירה אינה פתוחה')
  }

  const { data: settingsData } = await admin
    .from('gallery_settings')
    .select('max_album_selection, max_edit_selection')
    .eq('gallery_id', galleryId)
    .single()

  const settings = settingsData as {
    max_album_selection: number | null
    max_edit_selection: number | null
  } | null

  validateSelectionLimits(
    selections,
    settings?.max_album_selection,
    settings?.max_edit_selection
  )

  const { data: galleryPhotos } = await admin
    .from('photos')
    .select('id')
    .eq('gallery_id', galleryId)
    .eq('is_visible_to_client', true)

  const validPhotoIds = new Set(
    ((galleryPhotos ?? []) as { id: string }[]).map((photo) => photo.id)
  )

  const rows = selections
    .filter(
      (selection) =>
        validPhotoIds.has(selection.photoId) &&
        (selection.selected_album || selection.selected_edit)
    )
    .map((selection) => ({
      gallery_id: galleryId,
      photo_id: selection.photoId,
      selected_album: selection.selected_album,
      selected_edit: selection.selected_edit,
    }))

  await admin.from('photo_selections').delete().eq('gallery_id', galleryId)

  if (rows.length > 0) {
    const { error } = await admin.from('photo_selections').insert(rows as never)
    if (error) throw new Error('שמירת הבחירות נכשלה')
  }

  await admin
    .from('galleries')
    .update({ status: 'editing' } as never)
    .eq('id', galleryId)

  const albumCount = countSelections(selections, 'selected_album')
  const editCount = countSelections(selections, 'selected_edit')

  const client = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients

  await sendSelectionDoneEmail({
    galleryId,
    galleryTitle: gallery.title,
    userId: gallery.user_id,
    clientName: client?.name ?? 'לקוח',
    albumCount,
    editCount,
  })

  revalidatePath(`/g/${galleryId}`)
  revalidatePath(`/dashboard/galleries/${galleryId}`)
  return { success: true }
}

export async function markDeliveryReady(galleryId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('יש להתחבר מחדש')

  const { data: owned } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .eq('user_id', user.id)
    .single()

  if (!owned) throw new Error('גלריה לא נמצאה')

  const admin = createAdminClient()

  const { data: galleryData } = await admin
    .from('galleries')
    .select('id, title, clients(name, email)')
    .eq('id', galleryId)
    .single()

  type GalleryWithClient = {
    id: string
    title: string
    clients: { name: string; email: string | null } | { name: string; email: string | null }[] | null
  }

  const gallery = galleryData as GalleryWithClient | null
  if (!gallery) throw new Error('גלריה לא נמצאה')

  await prepareGalleryForDelivery(galleryId)

  await admin
    .from('galleries')
    .update({ status: 'delivery_ready' } as never)
    .eq('id', galleryId)

  const client = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients

  if (client?.email) {
    await sendDeliveryReadyEmail({
      galleryId,
      galleryTitle: gallery.title,
      clientEmail: client.email,
      clientName: client.name,
    })
  }

  revalidatePath(`/g/${galleryId}`)
  revalidatePath(`/dashboard/galleries/${galleryId}`)
}
