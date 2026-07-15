'use server'

import { assertGalleryOwner } from '@/lib/auth/gallery-owner'
import {
  generateGalleryPassword,
  hashGalleryPassword,
} from '@/lib/gallery-password'
import {
  galleryHasPassword,
  rotateGalleryPassword,
} from '@/lib/gallery-password-store'
import { revalidatePath } from 'next/cache'
import { requireDashboardContext, getDashboardContext } from '@/lib/auth/dashboard-context'
import type { DashboardAuthContext } from '@/lib/auth/dashboard-context'
import { processReferralBonusIfEligible } from '@/lib/referral/referral'
import { createPresignedUploadUrl, deleteMediaObject } from '@/lib/r2/storage'
import { isR2Configured } from '@/lib/r2/config'
import { validatePrimaryImageFile } from '@/lib/media-upload-limits'
import { buildCoverStoragePath, deriveCoverCardStoragePath } from '@/lib/images/cover-process'
import type { MediaBucket } from '@/lib/r2/types'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { resolveGalleryCoverImagePath, resolveGalleryCoverCardPath } from '@/lib/seo/public-metadata'
import { sendGalleryInviteEmail, sendDeliveryReadyEmail } from '@/lib/email/resend'
import type { Database, GalleryWithSettings } from '@/lib/types/database.types'
import type { GalleryStatus } from '@/lib/types/database.types'
import {
  PUBLIC_ONLY_MVP,
  MVP_GALLERY_DB_STATUS,
  buildPublicGalleryCountLimitError,
  getMaxPublicGalleriesForPhotographer,
} from '@/lib/types/app.types'

type GalleriesUpdate = Database['public']['Tables']['galleries']['Update']

async function resolvePhotographerGalleryLimit(context: DashboardAuthContext): Promise<number> {
  const { userId, supabase } = context
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle()

  const profileEmail = (data as { email: string | null } | null)?.email
  return getMaxPublicGalleriesForPhotographer(profileEmail ?? context.actorEmail)
}

const DELETE_BATCH_SIZE = 50

async function deleteGalleryMedia(supabase: DashboardAuthContext['supabase'], galleryId: string) {
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
  const { userId, supabase } = await requireDashboardContext()

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
    .eq('user_id', userId)
    .single()

  const gallery = data as GalleryEmailRow | null
  if (!gallery) throw new Error('גלריה לא נמצאה')
  return gallery
}

async function sendInviteEmailForGallery(
  gallery: GalleryEmailRow,
  plainPassword?: string
) {
  const client = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients
  const profile = Array.isArray(gallery.users) ? gallery.users[0] : gallery.users

  if (!client?.email) throw new Error('לא נמצא מייל ללקוח')
  if (!galleryHasPassword(gallery.password)) {
    throw new Error('לא הוגדרה סיסמה לגלריה')
  }

  const passwordToEmail =
    plainPassword ?? (await rotateGalleryPassword(gallery.id))

  await sendGalleryInviteEmail({
    galleryId: gallery.id,
    galleryTitle: gallery.title,
    clientEmail: client.email,
    clientName: client.name,
    studioName: profile?.studio_name ?? 'Studio Gallery',
    password: passwordToEmail,
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

const GALLERY_STATUSES: GalleryStatus[] = [
  'draft',
  'public',
  'selection',
  'editing',
  'delivery_ready',
  'locked',
]

export async function updateGalleryStatus(
  galleryId: string,
  status: GalleryStatus
) {
  if (!GALLERY_STATUSES.includes(status)) {
    throw new Error('סטטוס לא תקין')
  }

  const { userId, supabase } = await requireDashboardContext()

  const payload: GalleriesUpdate = { status }

  const { error } = await supabase
    .from('galleries')
    .update(payload as never)
    .eq('id', galleryId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/galleries/${galleryId}`)
  revalidatePath('/dashboard')
}

export async function sendGallery(galleryId: string, plainPasswordForEmail?: string) {
  const gallery = await fetchOwnedGalleryForEmail(galleryId)

  // Bypass email sending for public galleries (no client)
  if (!gallery.clients || (Array.isArray(gallery.clients) && gallery.clients.length === 0)) {
    await updateGalleryStatus(galleryId, 'selection')
    return
  }

  await updateGalleryStatus(galleryId, 'selection')
  await sendInviteEmailForGallery(gallery, plainPasswordForEmail)
}

export async function archiveGallery(galleryId: string) {
  await updateGalleryStatus(galleryId, 'locked')
}

export type CreateGalleryInput = {
  title: string
  clientId?: string | null
  galleryType: Database['public']['Tables']['galleries']['Row']['gallery_type']
  password?: string
  expiresAt?: string
  maxAlbumSelection?: number
  maxEditSelection?: number
  allowDownloadPreview?: boolean
  allowDownloadOriginal?: boolean
  watermarkText?: string
  autoApplyWatermark?: boolean
  sendToClient?: boolean
  isPublic?: boolean
  coverImage?: string
}

function generatePassword() {
  return generateGalleryPassword()
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
  const context = await requireDashboardContext()
  const { userId, supabase } = context

  const title = input.title.trim()
  if (!title) {
    throw new Error('שם הגלריה הוא שדה חובה')
  }

  const willBePublic = PUBLIC_ONLY_MVP ? true : Boolean(input.isPublic)
  if (willBePublic) {
    let countQuery = supabase
      .from('galleries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (!PUBLIC_ONLY_MVP) {
      countQuery = countQuery.eq('is_public', true)
    }

    const [{ count: galleryCount }, maxGalleries] = await Promise.all([
      countQuery,
      resolvePhotographerGalleryLimit(context),
    ])

    const limitError = buildPublicGalleryCountLimitError(galleryCount ?? 0, maxGalleries)
    if (limitError) throw new Error(limitError)
  }

  const plainPassword = input.password?.trim() || generatePassword()
  const hashedPassword = await hashGalleryPassword(plainPassword)

  const galleryPayload: Database['public']['Tables']['galleries']['Insert'] = {
    user_id: userId,
    client_id: input.clientId || null,
    title,
    gallery_type: input.galleryType,
    password: hashedPassword,
    expires_at: input.expiresAt || null,
    status: PUBLIC_ONLY_MVP
      ? MVP_GALLERY_DB_STATUS
      : input.isPublic || input.galleryType === 'portfolio'
      ? 'public'
      : 'draft',
    is_public: PUBLIC_ONLY_MVP ? true : input.isPublic || false,
    cover_image: input.coverImage || null,
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
      .eq('id', userId)
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
      auto_apply_watermark: input.autoApplyWatermark ?? true,
    }

  const { error: settingsError } = await supabase
    .from('gallery_settings')
    .upsert(settingsPayload as never, { onConflict: 'gallery_id' })

  if (settingsError) {
    throw new Error(settingsError.message)
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/galleries/${gallery.id}`)

  try {
    await processReferralBonusIfEligible(userId)
  } catch (referralError) {
    console.error('[createGallery] referral bonus failed', referralError)
  }

  if (input.sendToClient) {
    await sendGallery(gallery.id, plainPassword)
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
    autoApplyWatermark?: boolean
    isPublic?: boolean
    coverImage?: string | null
  }
) {
  console.log('updateGallerySettings called with:', { galleryId, input })
  const context = await requireDashboardContext()
  const { userId, supabase } = context

  if (input.title !== undefined) {
    const { error } = await supabase
      .from('galleries')
      .update({ title: input.title.trim() } as never)
      .eq('id', galleryId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  }

  const galleryUpdate: GalleriesUpdate = {}
  if (input.password !== undefined) {
    const trimmed = input.password.trim()
    if (trimmed) {
      galleryUpdate.password = await hashGalleryPassword(trimmed)
    }
  }
  if (input.expiresAt !== undefined) galleryUpdate.expires_at = input.expiresAt
  if (input.isPublic !== undefined) {
    if (input.isPublic) {
      const { data: existingGallery } = await supabase
        .from('galleries')
        .select('is_public')
        .eq('id', galleryId)
        .eq('user_id', userId)
        .single()

      const wasPublic = (existingGallery as { is_public: boolean } | null)?.is_public ?? false
      if (!wasPublic) {
        const [{ count: publicGalleryCount }, maxGalleries] = await Promise.all([
          supabase
            .from('galleries')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_public', true),
          resolvePhotographerGalleryLimit(context),
        ])

        const limitError = buildPublicGalleryCountLimitError(
          publicGalleryCount ?? 0,
          maxGalleries
        )
        if (limitError) throw new Error(limitError)
      }
    }

    galleryUpdate.is_public = input.isPublic
    if (input.isPublic) {
      galleryUpdate.status = PUBLIC_ONLY_MVP ? MVP_GALLERY_DB_STATUS : 'public'
    }
  }
  if (input.coverImage !== undefined) galleryUpdate.cover_image = input.coverImage

  if (Object.keys(galleryUpdate).length > 0) {
    console.log('Updating gallery:', galleryUpdate)
    const { error } = await supabase
      .from('galleries')
      .update(galleryUpdate as never)
      .eq('id', galleryId)
      .eq('user_id', userId)
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
  if (input.autoApplyWatermark !== undefined)
    settingsUpdate.auto_apply_watermark = input.autoApplyWatermark

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
  revalidatePath('/dashboard')
}

export async function getPublicGalleryQuota() {
  const context = await getDashboardContext()
  if (!context) return null

  const { userId, supabase } = context

  let countQuery = supabase
    .from('galleries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (!PUBLIC_ONLY_MVP) {
    countQuery = countQuery.eq('is_public', true)
  }

  const [{ count }, maxGalleries] = await Promise.all([
    countQuery,
    resolvePhotographerGalleryLimit(context),
  ])

  const galleryCount = count ?? 0

  return {
    galleryCount,
    maxGalleries,
    canCreateGallery: galleryCount < maxGalleries,
  }
}

export async function ensurePortfolioSlug(
  galleryId: string,
  title: string,
  currentSlug: string | null
) {
  if (currentSlug) return currentSlug

  const context = await getDashboardContext()
  if (!context) return null

  const { userId, supabase } = context

  const slug = portfolioSlug(title)
  const { error } = await supabase
    .from('galleries')
    .update({ slug } as never)
    .eq('id', galleryId)
    .eq('user_id', userId)
    .eq('gallery_type', 'portfolio')

  if (error) return null

  revalidatePath(`/dashboard/galleries/${galleryId}`)
  revalidatePath('/dashboard')
  return slug
}

export async function fetchGalleryDetail(galleryId: string) {
  const { supabase } = await assertGalleryOwner(galleryId)
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

export async function resolveGalleryTableThumbnails(
  galleries: { id: string; cover_image: string | null }[]
) {
  const context = await getDashboardContext()
  if (!context) return {}

  const { userId, supabase } = context

  const { data: profile } = await supabase
    .from('users')
    .select('logo_url')
    .eq('id', userId)
    .single()

  const logoUrl = await resolveBrandingPath(
    (profile as { logo_url: string | null } | null)?.logo_url ?? null
  )

  const thumbnails: Record<string, string | null> = {}

  await Promise.all(
    galleries.map(async (gallery) => {
      if (gallery.cover_image) {
        thumbnails[gallery.id] = await resolveGalleryCoverCardPath(
          gallery.cover_image,
          gallery.id
        )
      } else {
        thumbnails[gallery.id] = logoUrl
      }
    })
  )

  return thumbnails
}

export async function prepareGalleryCoverUpload(input: {
  contentType: string
  fileSize: number
  includeCard?: boolean
  displayOnly?: boolean
}) {
  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  const { userId } = await requireDashboardContext()

  validatePrimaryImageFile(input.contentType, input.fileSize)

  const path = buildCoverStoragePath(
    userId,
    Date.now(),
    input.displayOnly ? 'image/jpeg' : input.contentType
  )

  if (input.displayOnly) {
    const cardPath = deriveCoverCardStoragePath(path)
    if (!cardPath) {
      throw new Error('לא ניתן ליצור נתיב תצוגה לתמונת השער')
    }

    const uploadUrl = await createPresignedUploadUrl('branding', cardPath, 'image/jpeg')
    return { uploadUrl, path: cardPath, cardPath }
  }

  const uploadUrl = await createPresignedUploadUrl('branding', path, input.contentType)

  if (!input.includeCard) {
    return { uploadUrl, path }
  }

  const cardPath = deriveCoverCardStoragePath(path)
  if (!cardPath) {
    return { uploadUrl, path }
  }

  const cardUploadUrl = await createPresignedUploadUrl('branding', cardPath, 'image/jpeg')
  return { uploadUrl, path, cardUploadUrl, cardPath }
}

export async function fetchGalleryLayoutMode() {
  const context = await getDashboardContext()
  if (!context) return 'separated' as const

  const { userId, supabase } = context
  const { data, error } = await supabase
    .from('users')
    .select('gallery_layout_mode')
    .eq('id', userId)
    .single()

  if (error) {
    const message = error.message?.toLowerCase() ?? ''
    if (
      error.code === '42703' ||
      error.code === 'PGRST204' ||
      message.includes('gallery_layout_mode')
    ) {
      return 'separated'
    }
    throw new Error(error.message)
  }

  const mode = (data as { gallery_layout_mode: string } | null)?.gallery_layout_mode
  return mode === 'portfolio' ? 'portfolio' : 'separated'
}

export async function updateGalleryLayoutMode(mode: 'separated' | 'portfolio') {
  if (mode !== 'separated' && mode !== 'portfolio') {
    throw new Error('מצב תצוגה לא תקין')
  }

  const { userId, supabase } = await requireDashboardContext()

  const { error } = await supabase
    .from('users')
    .update({ gallery_layout_mode: mode } as never)
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/galleries')
  revalidatePath('/dashboard')

  const { data: profile } = await supabase
    .from('users')
    .select('slug')
    .eq('id', userId)
    .single()

  const slug = (profile as { slug: string | null } | null)?.slug
  if (slug) {
    revalidatePath(`/${slug}`)
    revalidatePath(`/${slug}/portfolio`)
  }

  return { success: true }
}
