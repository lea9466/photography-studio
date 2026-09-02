'use server'

import { assertGalleryOwner } from '@/lib/auth/gallery-owner'
import {
  generateGalleryPassword,
  hashGalleryPassword,
} from '@/lib/gallery-password'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireDashboardContext, getDashboardContext } from '@/lib/auth/dashboard-context'
import { assertFreeGalleryCanBecomePublic } from '@/lib/subscriptions/gallery-gate'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
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
import { getPublicSitePath } from '@/lib/queries/public-photographer'
import type { Database, GalleryWithSettings } from '@/lib/types/database.types'
import type { GalleryStatus } from '@/lib/types/database.types'
import {
  PUBLIC_ONLY_MVP,
  MVP_GALLERY_DB_STATUS,
  MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER,
  buildPublicGalleryCountLimitError,
  getMaxPublicGalleriesForPhotographer,
  isMvpBypassUser,
} from '@/lib/types/app.types'
import { getPhotographerPublicPhotoCount } from '@/lib/gallery-photo-limits'
import { galleryKindColumns } from '@/lib/gallery-kind'
import { assertSettingsInputAllowedForType } from '@/lib/gallery-settings-guard'
import { getPrivateGalleryEntitlements } from '@/lib/private-galleries/loader'
import { buildPrivateGalleryCountLimitError } from '@/lib/private-galleries/entitlements'

type GalleriesUpdate = Database['public']['Tables']['galleries']['Update']

/**
 * Revalidates both the new public gallery path (/{slug}/gallery/{id}) and
 * the old /public-gallery/{id} redirect shim, so a content change shows up
 * immediately regardless of which URL a visitor already has cached. Looks
 * the studio's slug up fresh each time (not cached) — see
 * app/[slug]/gallery/[id]/page.tsx's doc comment for why this can't go
 * stale even across a slug rename.
 */
export async function revalidateGalleryPublicPaths(userId: string, galleryId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('slug, studio_name')
    .eq('id', userId)
    .maybeSingle()

  const typedUser = data as { slug: string | null; studio_name: string | null } | null
  const studioPath = getPublicSitePath(typedUser?.slug, typedUser?.studio_name)
  if (studioPath) {
    revalidatePath(`${studioPath}/gallery/${galleryId}`)
  }
  revalidatePath(`/public-gallery/${galleryId}`)
}

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
      id, title, expires_at, status, gallery_type,
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

async function sendInviteEmailForGallery(gallery: GalleryEmailRow) {
  const client = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients
  const profile = Array.isArray(gallery.users) ? gallery.users[0] : gallery.users

  if (!client?.email) throw new Error('לא נמצא מייל ללקוח')

  // No password/code is emailed here — the client requests a one-time code
  // from the gate page on entry (see requestGalleryPassword). The invite
  // email is just the link.
  await sendGalleryInviteEmail({
    galleryId: gallery.id,
    galleryTitle: gallery.title,
    clientEmail: client.email,
    clientName: client.name,
    studioName: profile?.studio_name ?? 'Studio Gallery',
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
    revalidatePath(`/g/${galleryId}`)
    return
  }

  if (['selection', 'editing'].includes(gallery.status)) {
    await sendInviteEmailForGallery(gallery)
    revalidatePath(`/g/${galleryId}`)
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

  const { data: existing } = await supabase
    .from('galleries')
    .select('gallery_type')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .maybeSingle()

  const existingType = (existing as { gallery_type: string | null } | null)?.gallery_type
  // "public" is a showcase-only state — a private client gallery can never be
  // made public (see lib/gallery-kind.ts).
  if (status === 'public' && existingType !== 'portfolio') {
    throw new Error('לא ניתן להפוך גלריית לקוח לציבורית')
  }

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
  revalidatePath(`/g/${galleryId}`)
}

export async function sendGallery(galleryId: string) {
  const gallery = await fetchOwnedGalleryForEmail(galleryId)

  // Bypass email sending for public galleries (no client)
  if (!gallery.clients || (Array.isArray(gallery.clients) && gallery.clients.length === 0)) {
    await updateGalleryStatus(galleryId, 'selection')
    return
  }

  await updateGalleryStatus(galleryId, 'selection')
  await sendInviteEmailForGallery(gallery)
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
  albumSelectionEnabled?: boolean
  editSelectionEnabled?: boolean
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

/**
 * Album/edit selection caps are a "max N photos" count — a zero or negative
 * value is meaningless. The dashboard inputs already block non-digits, so
 * this is the backstop for a direct API call: anything that isn't a positive
 * integer becomes null ("no limit").
 */
function normalizeSelectionCap(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value < 1) return null
  return Math.floor(value)
}

export async function createGallery(input: CreateGalleryInput) {
  const context = await requireDashboardContext()
  const { userId, supabase } = context
  // MVP public-forcing only ever applied to showcase galleries. A client
  // (selection) gallery is a private product — it is never forced public,
  // for any account.
  const effectiveMvp =
    input.galleryType !== 'selection' &&
    PUBLIC_ONLY_MVP &&
    !isMvpBypassUser(userId)

  const title = input.title.trim()
  if (!title) {
    throw new Error('שם הגלריה הוא שדה חובה')
  }

  const willBePublic = effectiveMvp ? true : Boolean(input.isPublic)
  if (willBePublic) {
    const entitlements = await getStudioEntitlements(userId)
    // FREE: only one displayed gallery. PRO: unlimited gallery creation —
    // only the flat count cap below applies.
    if (!effectiveMvp && !entitlements.isPro) {
      await assertFreeGalleryCanBecomePublic(supabase, userId, '')
    }
    if (entitlements.isPro) {
      let countQuery = supabase
        .from('galleries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (!effectiveMvp) {
        countQuery = countQuery.eq('is_public', true)
      }

      const [{ count: galleryCount }, maxGalleries] = await Promise.all([
        countQuery,
        resolvePhotographerGalleryLimit(context),
      ])

      const limitError = buildPublicGalleryCountLimitError(galleryCount ?? 0, maxGalleries)
      if (limitError) throw new Error(limitError)
    }
  }

  let unlocksFreePrivateGallerySlot = false
  if (!willBePublic) {
    const pg = await getPrivateGalleryEntitlements(userId)
    if (pg.limits.isLifetimeCap) {
      const limitError = buildPrivateGalleryCountLimitError(
        pg.lifetimeUsed ? 1 : 0,
        1,
        true
      )
      if (limitError) throw new Error(limitError)
      unlocksFreePrivateGallerySlot = true
    } else {
      const { count: privateGalleryCount } = await supabase
        .from('galleries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('gallery_type', 'selection')

      const limitError = buildPrivateGalleryCountLimitError(
        privateGalleryCount ?? 0,
        pg.limits.maxGalleries,
        false
      )
      if (limitError) throw new Error(limitError)
    }
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
    status: effectiveMvp
      ? MVP_GALLERY_DB_STATUS
      : input.isPublic || input.galleryType === 'portfolio'
      ? 'public'
      : 'draft',
    is_public: effectiveMvp ? true : input.isPublic || false,
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

  if (unlocksFreePrivateGallerySlot) {
    await supabase
      .from('users')
      .update({ free_private_gallery_created: true } as never)
      .eq('id', userId)
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
      max_album_selection: normalizeSelectionCap(input.maxAlbumSelection),
      max_edit_selection: normalizeSelectionCap(input.maxEditSelection),
      album_selection_enabled: input.albumSelectionEnabled ?? true,
      edit_selection_enabled: input.editSelectionEnabled ?? true,
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

  if (input.galleryType === 'portfolio') {
    const slug = portfolioSlug(title)
    revalidatePath(`/portfolio/${slug}`)
    await revalidateGalleryPublicPaths(userId, gallery.id)
  }

  try {
    await processReferralBonusIfEligible(userId)
  } catch (referralError) {
    console.error('[createGallery] referral bonus failed', referralError)
  }

  if (input.sendToClient) {
    await sendGallery(gallery.id)
  }

  return { id: gallery.id }
}

export type CreateClientGalleryInput = {
  title: string
  clientId: string | null
  password?: string
  expiresAt?: string
  maxAlbumSelection?: number
  maxEditSelection?: number
  albumSelectionEnabled?: boolean
  editSelectionEnabled?: boolean
  allowDownloadPreview?: boolean
  allowDownloadOriginal?: boolean
  watermarkText?: string
  autoApplyWatermark?: boolean
  sendToClient?: boolean
  coverImage?: string
}

/**
 * Creates a private, password-gated client delivery gallery. `gallery_type`
 * and `is_public` are forced by the kind (see lib/gallery-kind.ts) and are
 * never caller-controlled — a client gallery can never be public.
 */
export async function createClientGallery(input: CreateClientGalleryInput) {
  const { galleryType, isPublic } = galleryKindColumns('client')
  return createGallery({ ...input, galleryType, isPublic })
}

export type CreateShowcaseGalleryInput = {
  title: string
  watermarkText?: string
  autoApplyWatermark?: boolean
  coverImage?: string
}

/**
 * Creates a public portfolio gallery for the studio's own site. No client, no
 * password; `gallery_type` and `is_public` are forced by the kind.
 */
export async function createShowcaseGallery(input: CreateShowcaseGalleryInput) {
  const { galleryType, isPublic } = galleryKindColumns('showcase')
  return createGallery({
    ...input,
    clientId: null,
    galleryType,
    isPublic,
    sendToClient: false,
  })
}

export async function updateGallerySettings(
  galleryId: string,
  input: {
    title?: string
    password?: string
    expiresAt?: string | null
    maxAlbumSelection?: number | null
    maxEditSelection?: number | null
    albumSelectionEnabled?: boolean
    editSelectionEnabled?: boolean
    allowDownloadPreview?: boolean
    allowDownloadOriginal?: boolean
    watermarkText?: string | null
    autoApplyWatermark?: boolean
    /**
     * Showcase galleries only: whether the gallery is shown on the studio's
     * public site right now. Rejected for client galleries — see the guard
     * below. This is visibility, never an identity change.
     */
    isPublic?: boolean
    coverImage?: string | null
  }
) {
  console.log('updateGallerySettings called with:', { galleryId, input })
  const context = await requireDashboardContext()
  const { userId, supabase } = context
  const effectiveMvp = PUBLIC_ONLY_MVP && !isMvpBypassUser(userId)

  // Single ownership + kind lookup, reused by the field guard and the isPublic
  // guard below.
  const { data: galleryRow } = await supabase
    .from('galleries')
    .select('is_public, gallery_type')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .maybeSingle()
  const existingGallery = galleryRow as
    | { is_public: boolean; gallery_type: string | null }
    | null
  if (!existingGallery) throw new Error('גלריה לא נמצאה')

  // A showcase and a client gallery have disjoint editable fields — never let a
  // caller push a field that doesn't belong to this gallery's kind.
  assertSettingsInputAllowedForType(existingGallery.gallery_type, input)

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
    // "Shown on site" is a showcase-gallery concept only. A client gallery's
    // is_public is security-load-bearing (it gates password-free photo
    // access — see lib/gallery-access.ts) and must never be flippable here.
    if (existingGallery.gallery_type !== 'portfolio') {
      throw new Error('לא ניתן לשנות את מצב ההצגה של גלריית לקוח')
    }

    if (input.isPublic && !existingGallery.is_public) {
      const entitlements = await getStudioEntitlements(userId)
      // FREE: only one shown gallery. PRO: the flat count cap below applies.
      if (!effectiveMvp && !entitlements.isPro) {
        await assertFreeGalleryCanBecomePublic(supabase, userId, galleryId)
      }
      if (entitlements.isPro) {
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
      galleryUpdate.status = effectiveMvp ? MVP_GALLERY_DB_STATUS : 'public'
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
    settingsUpdate.max_album_selection = normalizeSelectionCap(input.maxAlbumSelection)
  if (input.maxEditSelection !== undefined)
    settingsUpdate.max_edit_selection = normalizeSelectionCap(input.maxEditSelection)
  if (input.albumSelectionEnabled !== undefined)
    settingsUpdate.album_selection_enabled = input.albumSelectionEnabled
  if (input.editSelectionEnabled !== undefined)
    settingsUpdate.edit_selection_enabled = input.editSelectionEnabled
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
  revalidatePath('/dashboard/galleries')
  revalidatePath('/dashboard/private-galleries')
  revalidatePath('/dashboard')

  const { data: galleryMeta } = await supabase
    .from('galleries')
    .select('gallery_type, slug, title, is_public')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .maybeSingle()

  const meta = galleryMeta as {
    gallery_type: string
    slug: string | null
    title: string
    is_public: boolean
  } | null

  if (meta?.gallery_type === 'portfolio') {
    let slug = meta.slug?.trim() || null
    if (!slug) {
      slug = await ensurePortfolioSlug(galleryId, meta.title, meta.slug)
    }
    if (meta.is_public) {
      await revalidateGalleryPublicPaths(userId, galleryId)
      if (slug) {
        revalidatePath(`/portfolio/${slug}`)
      }
    }
  } else if (meta?.is_public) {
    await revalidateGalleryPublicPaths(userId, galleryId)
  }
}

export async function getPublicGalleryQuota() {
  const context = await getDashboardContext()
  if (!context) return null

  const { userId, supabase } = context
  const effectiveMvp = PUBLIC_ONLY_MVP && !isMvpBypassUser(userId)

  let countQuery = supabase
    .from('galleries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (!effectiveMvp) {
    countQuery = countQuery.eq('is_public', true)
  }

  const [{ count }, maxGalleries, photoCount, entitlements, { data: userRow }] =
    await Promise.all([
      countQuery,
      resolvePhotographerGalleryLimit(context),
      getPhotographerPublicPhotoCount(supabase, userId),
      getStudioEntitlements(userId),
      supabase.from('users').select('displayed_gallery_id').eq('id', userId).maybeSingle(),
    ])

  const galleryCount = count ?? 0
  const maxPhotos = MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER
  const isPro = entitlements.isPro
  const displayedGalleryId =
    (userRow as { displayed_gallery_id: string | null } | null)?.displayed_gallery_id ?? null

  return {
    galleryCount,
    // FREE: unlimited gallery creation — maxGalleries/canCreateGallery only
    // constrain PRO accounts (see createGallery/updateGallerySettings).
    maxGalleries: isPro ? maxGalleries : Infinity,
    photoCount,
    maxPhotos,
    remainingPhotos: Math.max(0, maxPhotos - photoCount),
    canCreateGallery: isPro ? galleryCount < maxGalleries : true,
    isPro,
    displayedGalleryId,
  }
}

export async function getPrivateGalleryQuota() {
  const context = await getDashboardContext()
  if (!context) return null

  const { userId, supabase } = context

  const [{ count }, pg] = await Promise.all([
    supabase
      .from('galleries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('gallery_type', 'selection'),
    getPrivateGalleryEntitlements(userId),
  ])

  // For the lifetime-cap tier, the number that actually gates creation is the
  // one-time-use flag, not how many `selection` galleries currently exist —
  // an account can have more (grandfathered in from before this feature) or
  // fewer (the one gallery was since deleted, which must NOT free the slot
  // back up) than the raw count. Show that flag instead so the displayed
  // "X מתוך Y" always matches what canCreateGallery actually enforces.
  const galleryCount = pg.limits.isLifetimeCap ? (pg.lifetimeUsed ? 1 : 0) : (count ?? 0)
  const canCreateGallery = pg.limits.isLifetimeCap
    ? !pg.lifetimeUsed
    : galleryCount < pg.limits.maxGalleries

  return {
    tier: pg.tier,
    galleryCount,
    maxGalleries: pg.limits.maxGalleries,
    maxPhotosPerGallery: pg.limits.maxPhotosPerGallery,
    isLifetime: pg.limits.isLifetimeCap,
    canCreateGallery,
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
  revalidatePath(`/portfolio/${slug}`)
  await revalidateGalleryPublicPaths(userId, galleryId)
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
    .select('slug, studio_name')
    .eq('id', userId)
    .single()

  const studioPath = getPublicSitePath(
    (profile as { slug: string | null; studio_name: string | null } | null)?.slug,
    (profile as { slug: string | null; studio_name: string | null } | null)?.studio_name
  )
  if (studioPath) {
    revalidatePath(studioPath)
    revalidatePath(`${studioPath}/portfolio`)
  }

  return { success: true }
}

export async function fetchGalleriesSectionSettings(): Promise<{
  galleries_title: string | null
  recent_photos_title: string | null
  selected_theme: string | null
  gallery_layout_mode: 'separated' | 'portfolio'
}> {
  const context = await getDashboardContext()
  if (!context) {
    return {
      galleries_title: null,
      recent_photos_title: null,
      selected_theme: null,
      gallery_layout_mode: 'separated',
    }
  }

  const { userId, supabase } = context
  const { data, error } = await supabase
    .from('users')
    .select('galleries_title, recent_photos_title, selected_theme, gallery_layout_mode')
    .eq('id', userId)
    .single()

  if (error) {
    const message = error.message?.toLowerCase() ?? ''
    if (
      error.code === '42703' ||
      error.code === 'PGRST204' ||
      message.includes('galleries_title') ||
      message.includes('recent_photos_title') ||
      message.includes('gallery_layout_mode')
    ) {
      return {
        galleries_title: null,
        recent_photos_title: null,
        selected_theme: null,
        gallery_layout_mode: 'separated',
      }
    }
    throw new Error(error.message)
  }

  const row = data as {
    galleries_title: string | null
    recent_photos_title: string | null
    selected_theme: string | null
    gallery_layout_mode: string | null
  }

  return {
    galleries_title: row.galleries_title ?? null,
    recent_photos_title: row.recent_photos_title ?? null,
    selected_theme: row.selected_theme ?? null,
    gallery_layout_mode: row.gallery_layout_mode === 'portfolio' ? 'portfolio' : 'separated',
  }
}

export async function updateGalleriesSectionTitle(input: {
  title?: string
}): Promise<{ galleries_title: string | null }> {
  const { userId, supabase } = await requireDashboardContext()

  if (input.title === undefined) {
    throw new Error('אין שינויים לשמירה')
  }

  const payload: Database['public']['Tables']['users']['Update'] = {
    galleries_title: input.title.trim() || null,
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload as never)
    .eq('id', userId)
    .select('galleries_title')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/galleries')

  const { data: profile } = await supabase
    .from('users')
    .select('slug, studio_name')
    .eq('id', userId)
    .single()

  const studioPath = getPublicSitePath(
    (profile as { slug: string | null; studio_name: string | null } | null)?.slug,
    (profile as { slug: string | null; studio_name: string | null } | null)?.studio_name
  )
  if (studioPath) {
    revalidatePath(studioPath)
    revalidatePath(`${studioPath}/portfolio`)
  }

  return data as { galleries_title: string | null }
}

export async function updateRecentPhotosSectionTitle(input: {
  title?: string
}): Promise<{ recent_photos_title: string | null }> {
  const { userId, supabase } = await requireDashboardContext()

  if (input.title === undefined) {
    throw new Error('אין שינויים לשמירה')
  }

  const payload: Database['public']['Tables']['users']['Update'] = {
    recent_photos_title: input.title.trim() || null,
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload as never)
    .eq('id', userId)
    .select('recent_photos_title')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/galleries')

  const { data: profile } = await supabase
    .from('users')
    .select('slug, studio_name')
    .eq('id', userId)
    .single()

  const studioPath = getPublicSitePath(
    (profile as { slug: string | null; studio_name: string | null } | null)?.slug,
    (profile as { slug: string | null; studio_name: string | null } | null)?.studio_name
  )
  if (studioPath) {
    revalidatePath(studioPath)
  }

  return data as { recent_photos_title: string | null }
}

export async function updateDisplayedGallery(input: {
  galleryId: string | null
}): Promise<{ displayed_gallery_id: string | null }> {
  const { userId, supabase } = await requireDashboardContext()

  if (input.galleryId) {
    const { data: gallery } = await supabase
      .from('galleries')
      .select('id, is_public')
      .eq('id', input.galleryId)
      .eq('user_id', userId)
      .maybeSingle()
    if (!gallery) throw new Error('גלריה לא נמצאה')
    if (!(gallery as { is_public: boolean }).is_public) {
      throw new Error('אפשר להציג רק גלריה ציבורית')
    }
  }

  const payload: Database['public']['Tables']['users']['Update'] = {
    displayed_gallery_id: input.galleryId,
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload as never)
    .eq('id', userId)
    .select('displayed_gallery_id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/galleries')
  revalidatePath('/[slug]', 'page')

  return data as { displayed_gallery_id: string | null }
}
