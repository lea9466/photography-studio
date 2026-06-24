'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteMediaObject } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'
import { sendGalleryInviteEmail, sendDeliveryReadyEmail } from '@/lib/email/resend'
import type { Database, GalleryWithSettings } from '@/lib/types/database.types'
import type { GalleryStatus } from '@/lib/types/database.types'

type GalleriesUpdate = Database['public']['Tables']['galleries']['Update']

const DELETE_BATCH_SIZE = 50

async function assertGalleryOwner(galleryId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const { data: gallery } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .eq('user_id', user.id)
    .single()

  if (!gallery) throw new Error('גלריה לא נמצאה')

  return { supabase, user }
}

async function deleteGalleryMedia(supabase: Awaited<ReturnType<typeof createClient>>, galleryId: string) {
  const [photosResult, editedResult, jobsResult] = await Promise.all([
    supabase
      .from('photos')
      .select('original_url, preview_url, watermarked_preview_url')
      .eq('gallery_id', galleryId),
    supabase.from('edited_photos').select('final_url').eq('gallery_id', galleryId),
    supabase.from('download_jobs').select('file_url').eq('gallery_id', galleryId),
  ])

  if (photosResult.error) throw new Error(photosResult.error.message)
  if (editedResult.error) throw new Error(editedResult.error.message)
  if (jobsResult.error) throw new Error(jobsResult.error.message)

  type PhotoRow = {
    original_url: string | null
    preview_url: string | null
    watermarked_preview_url: string | null
  }

  const storageDeletes: { bucket: MediaBucket; path: string }[] = []

  for (const photo of (photosResult.data ?? []) as PhotoRow[]) {
    if (photo.original_url) {
      storageDeletes.push({ bucket: 'originals', path: photo.original_url })
    }
    if (photo.preview_url) {
      storageDeletes.push({ bucket: 'previews', path: photo.preview_url })
    }
    if (photo.watermarked_preview_url) {
      storageDeletes.push({
        bucket: 'watermarked',
        path: photo.watermarked_preview_url,
      })
    }
  }

  for (const row of (editedResult.data ?? []) as { final_url: string | null }[]) {
    if (row.final_url) {
      storageDeletes.push({ bucket: 'edited', path: row.final_url })
    }
  }

  for (const row of (jobsResult.data ?? []) as { file_url: string | null }[]) {
    if (row.file_url) {
      storageDeletes.push({ bucket: 'zips', path: row.file_url })
    }
  }

  for (let offset = 0; offset < storageDeletes.length; offset += DELETE_BATCH_SIZE) {
    const chunk = storageDeletes.slice(offset, offset + DELETE_BATCH_SIZE)
    await Promise.all(
      chunk.map(({ bucket, path }) => deleteMediaObject(bucket, path))
    )
  }
}

export async function deleteGallery(galleryId: string) {
  const { supabase } = await assertGalleryOwner(galleryId)

  await deleteGalleryMedia(supabase, galleryId)

  const { error } = await supabase
    .from('galleries')
    .delete()
    .eq('id', galleryId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/galleries/${galleryId}`)
  revalidatePath(`/g/${galleryId}`)

  return { success: true }
}

type GalleryEmailRow = {
  id: string
  title: string
  password: string | null
  expires_at: string | null
  status: GalleryStatus
  gallery_type: Database['public']['Tables']['galleries']['Row']['gallery_type']
  clients: { name: string; email: string | null } | { name: string; email: string | null }[] | null
  users: { studio_name: string | null } | { studio_name: string | null }[] | null
}

async function fetchOwnedGalleryForEmail(galleryId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('יש להתחבר מחדש')

  const { data } = await supabase
    .from('galleries')
    .select(
      `
      id, title, password, expires_at, status, gallery_type,
      clients (name, email),
      users!galleries_user_id_fkey (studio_name)
    `
    )
    .eq('id', galleryId)
    .eq('user_id', user.id)
    .single()

  const gallery = data as GalleryEmailRow | null
  if (!gallery) throw new Error('גלריה לא נמצאה')
  return gallery
}

async function sendInviteEmailForGallery(gallery: GalleryEmailRow) {
  const client = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients
  const profile = Array.isArray(gallery.users) ? gallery.users[0] : gallery.users

  if (!client?.email) throw new Error('לא נמצא מייל ללקוח')
  if (!gallery.password) throw new Error('לא הוגדרה סיסמה לגלריה')

  await sendGalleryInviteEmail({
    galleryId: gallery.id,
    galleryTitle: gallery.title,
    clientEmail: client.email,
    clientName: client.name,
    studioName: profile?.studio_name ?? 'Studio Gallery',
    password: gallery.password,
    expiresAt: gallery.expires_at,
  })
}

async function sendDeliveryEmailForGallery(gallery: GalleryEmailRow) {
  const client = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients

  if (!client?.email) throw new Error('לא נמצא מייל ללקוח')

  await sendDeliveryReadyEmail({
    galleryId: gallery.id,
    galleryTitle: gallery.title,
    clientEmail: client.email,
    clientName: client.name,
  })
}

export async function resendGalleryEmail(galleryId: string) {
  const gallery = await fetchOwnedGalleryForEmail(galleryId)

  if (gallery.gallery_type === 'portfolio') {
    throw new Error('לא ניתן לשלוח מייל לתיק עבודות')
  }
  if (gallery.status === 'draft') {
    throw new Error('יש לשלוח את הגלריה לפני שליחת מייל חוזר')
  }

  if (['delivery_ready', 'locked'].includes(gallery.status)) {
    await sendDeliveryEmailForGallery(gallery)
    return
  }

  if (['selection', 'editing'].includes(gallery.status)) {
    await sendInviteEmailForGallery(gallery)
    return
  }

  throw new Error('לא ניתן לשלוח מייל בשלב זה')
}

export async function updateGalleryStatus(
  galleryId: string,
  status: GalleryStatus
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('יש להתחבר מחדש')
  }

  const payload: GalleriesUpdate = { status }

  const { error } = await supabase
    .from('galleries')
    .update(payload as never)
    .eq('id', galleryId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/galleries/${galleryId}`)
  revalidatePath('/dashboard')
}

export async function sendGallery(galleryId: string) {
  const gallery = await fetchOwnedGalleryForEmail(galleryId)

  await updateGalleryStatus(galleryId, 'selection')
  await sendInviteEmailForGallery(gallery)
}

export async function archiveGallery(galleryId: string) {
  await updateGalleryStatus(galleryId, 'locked')
}

export type CreateGalleryInput = {
  title: string
  clientId: string
  galleryType: Database['public']['Tables']['galleries']['Row']['gallery_type']
  password?: string
  expiresAt?: string
  maxAlbumSelection?: number
  maxEditSelection?: number
  allowDownloadPreview?: boolean
  allowDownloadOriginal?: boolean
  watermarkText?: string
  sendToClient?: boolean
}

function generatePassword() {
  return Math.random().toString(36).slice(2, 10)
}

function slugifyPortfolioTitle(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\u0590-\u05FF]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || 'portfolio'
}

function portfolioSlug(title: string) {
  return `${slugifyPortfolioTitle(title)}-${Math.random().toString(36).slice(2, 8)}`
}

export async function createGallery(input: CreateGalleryInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('יש להתחבר מחדש')
  }

  const title = input.title.trim()
  if (!title) {
    throw new Error('שם הגלריה הוא שדה חובה')
  }

  const galleryPayload: Database['public']['Tables']['galleries']['Insert'] = {
    user_id: user.id,
    client_id: input.clientId,
    title,
    gallery_type: input.galleryType,
    password: input.password?.trim() || generatePassword(),
    expires_at: input.expiresAt || null,
    status: 'draft',
    ...(input.galleryType === 'portfolio'
      ? { slug: portfolioSlug(title) }
      : {}),
  }

  const { data, error: galleryError } = await supabase
    .from('galleries')
    .insert(galleryPayload as never)
    .select('id')
    .single()

  const gallery = data as { id: string } | null

  if (galleryError || !gallery) {
    throw new Error(galleryError?.message ?? 'יצירת הגלריה נכשלה')
  }

  let watermarkText: string | null = input.watermarkText?.trim() || null
  if (!watermarkText) {
    const { data: profile } = await supabase
      .from('users')
      .select('studio_name')
      .eq('id', user.id)
      .single()
    watermarkText =
      (profile as { studio_name: string | null } | null)?.studio_name?.trim() ||
      null
  }

  const settingsPayload: Database['public']['Tables']['gallery_settings']['Insert'] =
    {
      gallery_id: gallery.id,
      max_album_selection: input.maxAlbumSelection ?? null,
      max_edit_selection: input.maxEditSelection ?? null,
      allow_download_preview: input.allowDownloadPreview ?? false,
      allow_download_original: input.allowDownloadOriginal ?? false,
      watermark_text: watermarkText,
    }

  const { error: settingsError } = await supabase
    .from('gallery_settings')
    .upsert(settingsPayload as never, { onConflict: 'gallery_id' })

  if (settingsError) {
    throw new Error(settingsError.message)
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/galleries/${gallery.id}`)

  if (input.sendToClient) {
    await sendGallery(gallery.id)
  }

  return { id: gallery.id }
}

export async function updateGallerySettings(
  galleryId: string,
  input: {
    title?: string
    password?: string
    expiresAt?: string | null
    maxAlbumSelection?: number | null
    maxEditSelection?: number | null
    allowDownloadPreview?: boolean
    allowDownloadOriginal?: boolean
    watermarkText?: string | null
  }
) {
  console.log('updateGallerySettings called with:', { galleryId, input })
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('יש להתחבר מחדש')

  if (input.title !== undefined) {
    const { error } = await supabase
      .from('galleries')
      .update({ title: input.title.trim() } as never)
      .eq('id', galleryId)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
  }

  const galleryUpdate: GalleriesUpdate = {}
  if (input.password !== undefined) galleryUpdate.password = input.password
  if (input.expiresAt !== undefined) galleryUpdate.expires_at = input.expiresAt

  if (Object.keys(galleryUpdate).length > 0) {
    console.log('Updating gallery:', galleryUpdate)
    const { error } = await supabase
      .from('galleries')
      .update(galleryUpdate as never)
      .eq('id', galleryId)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
  }

  const settingsUpdate: Database['public']['Tables']['gallery_settings']['Update'] =
    {}
  if (input.maxAlbumSelection !== undefined)
    settingsUpdate.max_album_selection = input.maxAlbumSelection
  if (input.maxEditSelection !== undefined)
    settingsUpdate.max_edit_selection = input.maxEditSelection
  if (input.allowDownloadPreview !== undefined)
    settingsUpdate.allow_download_preview = input.allowDownloadPreview
  if (input.allowDownloadOriginal !== undefined)
    settingsUpdate.allow_download_original = input.allowDownloadOriginal
  if (input.watermarkText !== undefined)
    settingsUpdate.watermark_text = input.watermarkText

  console.log('Updating settings:', settingsUpdate)
  if (Object.keys(settingsUpdate).length > 0) {
    const { error } = await supabase
      .from('gallery_settings')
      .update(settingsUpdate as never)
      .eq('gallery_id', galleryId)
    if (error) throw new Error(error.message)
  }

  revalidatePath(`/dashboard/galleries/${galleryId}`)
  revalidatePath(`/dashboard/galleries/${galleryId}/settings`)
}

export async function ensurePortfolioSlug(
  galleryId: string,
  title: string,
  currentSlug: string | null
) {
  if (currentSlug) return currentSlug

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const slug = portfolioSlug(title)
  const { error } = await supabase
    .from('galleries')
    .update({ slug } as never)
    .eq('id', galleryId)
    .eq('user_id', user.id)
    .eq('gallery_type', 'portfolio')

  if (error) return null

  revalidatePath(`/dashboard/galleries/${galleryId}`)
  revalidatePath('/dashboard')
  return slug
}

export async function fetchGalleryDetail(galleryId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('galleries')
    .select(
      `
      *,
      clients (id, name, email, phone),
      gallery_settings (*)
    `
    )
    .eq('id', galleryId)
    .single()

  if (error) throw new Error(error.message)
  return data as GalleryWithSettings | null
}
