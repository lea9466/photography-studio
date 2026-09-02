'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  hasGallerySession,
  setGallerySession,
  touchGallerySession,
} from '@/lib/gallery-session'
import { prepareGalleryForDelivery } from '@/lib/actions/photo.actions'
import {
  sendGalleryPasswordEmail,
  sendSelectionDoneEmail,
  sendDeliveryReadyEmail,
} from '@/lib/email/resend'
import { maskEmail } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'
import type { GalleryStatus } from '@/lib/types/database.types'
import {
  countSelections,
  checkSelectionLimits,
  type ClientSelectionPayload,
} from '@/lib/gallery-selection'
import { verifyGalleryPassword as checkGalleryPassword } from '@/lib/gallery-password'
import {
  galleryHasPassword,
  migrateLegacyGalleryPassword,
  rotateGalleryPassword,
} from '@/lib/gallery-password-store'
import {
  checkRateLimit,
  resetRateLimit,
} from '@/lib/rate-limit/gallery-password'
import { resolveGalleryAccessMode } from '@/lib/gallery-access'

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
  width: number | null
  height: number | null
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
  album_selection_enabled: boolean
  edit_selection_enabled: boolean
  allow_download_preview: boolean
  allow_download_original: boolean
}

/**
 * `forceProxy` must be true for any non-public gallery — see the comment on
 * resolveMediaUrl in lib/r2/storage.ts for why the bucket-level public/private
 * split alone isn't enough to protect a private gallery's photos.
 */
async function signPath(
  bucket: MediaBucket,
  path: string | null,
  galleryId?: string,
  forceProxy = false
) {
  return resolveMediaUrl(bucket, path, galleryId, forceProxy)
}

export async function getClientGalleryPublicMeta(galleryId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('galleries')
    .select(
      'id, title, status, gallery_type, is_public, expires_at, users!galleries_user_id_fkey(studio_name), clients(email)'
    )
    .eq('id', galleryId)
    .single()

  type Row = {
    id: string
    title: string
    status: GalleryStatus
    gallery_type: string
    is_public: boolean
    expires_at: string | null
    users: { studio_name: string | null } | { studio_name: string | null }[] | null
    clients: { email: string | null } | { email: string | null }[] | null
  }

  const gallery = data as Row | null
  if (!gallery) return null
  // Allow portfolio galleries if they are public
  if (gallery.gallery_type === 'portfolio' && !gallery.is_public) return null

  const user = Array.isArray(gallery.users) ? gallery.users[0] : gallery.users
  const client = Array.isArray(gallery.clients) ? gallery.clients[0] : gallery.clients
  const maskedEmail = client?.email ? maskEmail(client.email) : null

  return {
    id: gallery.id,
    title: gallery.title,
    status: gallery.status,
    gallery_type: gallery.gallery_type,
    is_public: gallery.is_public,
    // Client galleries carry an optional access deadline; portfolios don't expire.
    is_expired:
      !gallery.is_public &&
      gallery.expires_at != null &&
      new Date(gallery.expires_at) < new Date(),
    studio_name: user?.studio_name ?? null,
    maskedEmail,
  }
}

/**
 * Result of a client-facing gallery action. Errors are *returned*, not thrown:
 * Next.js swaps thrown Server Action error messages for a generic string in
 * production, so a thrown message never reaches the browser.
 */
export type GalleryActionResult<T = Record<never, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; expired?: boolean }

export async function requestGalleryPassword(
  galleryId: string
): Promise<GalleryActionResult<{ maskedEmail: string | null }>> {
  const headerStore = await headers()
  const ip =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerStore.get('x-real-ip')?.trim() ??
    'unknown'
  const requestRateKey = `gallery-pw-request:${galleryId}:${ip}`

  const requestRate = checkRateLimit(requestRateKey, 3, 15 * 60 * 1000)
  if (!requestRate.allowed) {
    const minutes = Math.max(1, Math.ceil((requestRate.retryAfterMs ?? 60_000) / 60_000))
    return { ok: false, error: `יותר מדי בקשות. נסו שוב בעוד ${minutes} דקות.` }
  }

  const admin = createAdminClient()

  const { data } = await admin
    .from('galleries')
    .select(
      `
      id, title, password, expires_at, status,
      clients (name, email),
      users!galleries_user_id_fkey (studio_name)
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
  if (!gallery) return { ok: false, error: 'הגלריה לא נמצאה' }
  if (gallery.status === 'draft') {
    return { ok: false, error: 'הגלריה עדיין לא נשלחה על ידי הצלם/ת' }
  }
  if (gallery.status === 'locked') {
    return { ok: false, error: 'הגלריה נסגרה על ידי הצלם/ת' }
  }
  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return {
      ok: false,
      expired: true,
      error: 'פג תוקף הגלריה. פנו לצלם/ת כדי לחדש את הגישה.',
    }
  }

  const client = Array.isArray(gallery.clients) ? gallery.clients[0] : gallery.clients
  if (!client?.email) {
    return { ok: false, error: 'לא נמצא מייל ללקוח — פנו לצלם/ת' }
  }
  if (!galleryHasPassword(gallery.password)) {
    return { ok: false, error: 'לא הוגדרה סיסמה לגלריה — פנו לצלם/ת' }
  }

  const profile = Array.isArray(gallery.users) ? gallery.users[0] : gallery.users
  const maskedEmail = maskEmail(client.email)

  const code = await rotateGalleryPassword(gallery.id)

  // The code was already rotated, so on a send failure the client's previous
  // code is dead and they never got the new one — surface it so they can
  // request another (which just rotates + sends again).
  try {
    await sendGalleryPasswordEmail({
      galleryId: gallery.id,
      galleryTitle: gallery.title,
      clientEmail: client.email,
      clientName: client.name,
      studioName: profile?.studio_name ?? 'Studio Gallery',
      code,
    })
  } catch (error) {
    console.error('[requestGalleryPassword] email send failed', {
      galleryId: gallery.id,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return { ok: false, error: 'שליחת קוד הכניסה נכשלה כרגע. נסו שוב בעוד רגע.' }
  }

  return { ok: true, maskedEmail }
}

export async function verifyGalleryPassword(
  galleryId: string,
  password: string
): Promise<GalleryActionResult> {
  const headerStore = await headers()
  const ip =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerStore.get('x-real-ip')?.trim() ??
    'unknown'
  const rateKey = `gallery-pw:${galleryId}:${ip}`

  const rate = checkRateLimit(rateKey)
  if (!rate.allowed) {
    const minutes = Math.max(1, Math.ceil((rate.retryAfterMs ?? 60_000) / 60_000))
    return { ok: false, error: `יותר מדי ניסיונות. נסו שוב בעוד ${minutes} דקות.` }
  }

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
  if (!gallery) return { ok: false, error: 'הגלריה לא נמצאה' }
  if (gallery.status === 'locked') {
    return { ok: false, error: 'הגלריה נסגרה על ידי הצלם/ת' }
  }
  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return {
      ok: false,
      expired: true,
      error: 'פג תוקף הגלריה. פנו לצלם/ת כדי לחדש את הגישה.',
    }
  }

  const { valid, needsRehash } = await checkGalleryPassword(
    password,
    gallery.password
  )
  if (!valid) {
    return {
      ok: false,
      error: 'הקוד שגוי או שכבר נעשה בו שימוש. בקשו קוד חדש ונסו שוב.',
    }
  }

  if (needsRehash) {
    await migrateLegacyGalleryPassword(galleryId, password.trim(), gallery.password)
  }

  // One-time use: burn the code that was just entered so it can't be reused
  // or shared — the client must request a fresh one next time.
  await rotateGalleryPassword(galleryId)

  resetRateLimit(rateKey)
  await setGallerySession(galleryId)
  return { ok: true }
}

async function requireValidGalleryAccess(galleryId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('galleries')
    .select('id, is_public')
    .eq('id', galleryId)
    .maybeSingle()

  const gallery = data as { id: string; is_public: boolean } | null
  if (!gallery) return null

  // Called from app/g/[id]/page.tsx during Server Component render (both
  // directly and via getClientGallery), where cookies() cannot be written —
  // must stay read-only here, unlike the action call sites below.
  const hasSessionForGallery = await hasGallerySession(galleryId)
  return resolveGalleryAccessMode({
    isPublic: gallery.is_public,
    hasSessionForGallery,
  })
}

/** Loads gallery + signed URLs. Call only after requireValidGalleryAccess. */
async function loadClientGalleryInternal(galleryId: string) {
  const admin = createAdminClient()

  const { data: galleryData } = await admin
    .from('galleries')
    .select(
      `
      id, title, status, gallery_type, user_id, is_public,
      users!galleries_user_id_fkey (studio_name, logo_url),
      gallery_settings (
        max_album_selection, max_edit_selection,
        album_selection_enabled, edit_selection_enabled,
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
    is_public: boolean
    users: { studio_name: string | null; logo_url: string | null } | { studio_name: string | null; logo_url: string | null }[] | null
    gallery_settings: {
      max_album_selection: number | null
      max_edit_selection: number | null
      album_selection_enabled: boolean
      edit_selection_enabled: boolean
      allow_download_preview: boolean
      allow_download_original: boolean
    } | { max_album_selection: number | null; max_edit_selection: number | null; album_selection_enabled: boolean; edit_selection_enabled: boolean; allow_download_preview: boolean; allow_download_original: boolean }[] | null
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
      id, preview_url, watermarked_preview_url, is_visible_to_client, is_processed, width, height,
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
    is_processed: boolean
    width: number | null
    height: number | null
    photo_selections: { selected_album: boolean; selected_edit: boolean } | { selected_album: boolean; selected_edit: boolean }[] | null
    edited_photos: { final_url: string | null } | { final_url: string | null }[] | null
  }

  const useWatermarked = !['delivery_ready', 'locked'].includes(gallery.status)
  const isDelivered = !useWatermarked
  const forcePublicWatermarked = gallery.is_public

  const clientPhotos: ClientGalleryPhoto[] = await Promise.all(
    ((photos ?? []) as PhotoRow[]).map(async (photo) => {
      const selection = Array.isArray(photo.photo_selections)
        ? photo.photo_selections[0]
        : photo.photo_selections
      const edited = Array.isArray(photo.edited_photos)
        ? photo.edited_photos[0]
        : photo.edited_photos

      // A photo counts as delivered either through the precise per-selection
      // match (edited_photos, uploaded via the dedicated "Selections" page)
      // or simply by being marked processed through the general upload
      // tab — whichever the photographer used. Same end result either way.
      const matchedEditPath = edited?.final_url ?? null
      const editedPath = matchedEditPath ?? (photo.is_processed ? photo.preview_url : null)
      const editedBucket: MediaBucket = matchedEditPath ? 'edited' : 'previews'

      const lightboxPath = forcePublicWatermarked
        ? photo.watermarked_preview_url
        : useWatermarked
          ? photo.watermarked_preview_url
          : editedPath ?? photo.preview_url

      const gridPath = forcePublicWatermarked
        ? photo.watermarked_preview_url
        : isDelivered && editedPath
          ? editedPath
          : useWatermarked && photo.watermarked_preview_url
            ? photo.watermarked_preview_url
            : photo.preview_url

      const gridBucket: MediaBucket = forcePublicWatermarked
        ? 'watermarked'
        : isDelivered && editedPath
          ? editedBucket
          : useWatermarked && photo.watermarked_preview_url
            ? 'watermarked'
            : 'previews'

      const lightboxBucket: MediaBucket = forcePublicWatermarked
        ? 'watermarked'
        : isDelivered && editedPath
          ? editedBucket
          : useWatermarked
            ? 'watermarked'
            : 'previews'

      // Only a genuinely public gallery may use the direct public-CDN
      // shortcut — a private gallery's previews/watermarked images must
      // always go through the session-gated proxy.
      const forceProxy = !gallery.is_public

      return {
        id: photo.id,
        preview_url: photo.preview_url,
        watermarked_preview_url: photo.watermarked_preview_url,
        is_visible_to_client: photo.is_visible_to_client,
        selected_album: selection?.selected_album ?? false,
        selected_edit: selection?.selected_edit ?? false,
        edited_url: editedPath,
        preview_signed_url: await signPath(gridBucket, gridPath, galleryId, forceProxy),
        lightbox_signed_url: await signPath(lightboxBucket, lightboxPath, galleryId, forceProxy),
        edited_signed_url: await signPath(editedBucket, editedPath, galleryId, forceProxy),
        width: photo.width,
        height: photo.height,
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
    album_selection_enabled: settings?.album_selection_enabled ?? true,
    edit_selection_enabled: settings?.edit_selection_enabled ?? true,
    allow_download_preview: settings?.allow_download_preview ?? false,
    allow_download_original: settings?.allow_download_original ?? false,
  }

  return { gallery: meta, photos: clientPhotos }
}

/**
 * Client-callable Server Action. Authorization is enforced server-side:
 * public galleries (is_public) or a session cookie bound to this galleryId.
 * There is no client-controlled bypass flag.
 */
export async function getClientGallery(galleryId: string) {
  const access = await requireValidGalleryAccess(galleryId)
  if (!access) return null
  return loadClientGalleryInternal(galleryId)
}

export async function getPublicPortfolioGallery(galleryId: string) {
  const admin = createAdminClient()

  const { data: galleryData } = await admin
    .from('galleries')
    .select(
      `
      id, title, created_at, gallery_type,
      users!galleries_user_id_fkey (studio_name, logo_url, accent_color, selected_theme, hero_desktop_url, hero_mobile_url)
    `
    )
    .eq('id', galleryId)
    .eq('gallery_type', 'portfolio')
    .eq('is_public', true)
    .single()

  if (!galleryData) return null

  type PortfolioGalleryDetail = {
    id: string
    title: string
    created_at: string
    gallery_type: string
    users: {
      studio_name: string | null
      logo_url: string | null
      accent_color: string
      selected_theme: string
      hero_desktop_url: string | null
      hero_mobile_url: string | null
    } | {
      studio_name: string | null
      logo_url: string | null
      accent_color: string
      selected_theme: string
      hero_desktop_url: string | null
      hero_mobile_url: string | null
    }[] | null
  }

  const gallery = galleryData as PortfolioGalleryDetail
  const user = Array.isArray(gallery.users) ? gallery.users[0] : gallery.users

  const { data: photos } = await admin
    .from('photos')
    .select('id, preview_url, watermarked_preview_url, width, height')
    .eq('gallery_id', galleryId)
    .eq('is_visible_to_client', true)
    .order('sort_order', { ascending: true })

  type PhotoRow = {
    id: string
    preview_url: string | null
    watermarked_preview_url: string | null
    width: number | null
    height: number | null
  }

  const portfolioPhotos = await Promise.all(
    ((photos ?? []) as PhotoRow[]).map(async (photo) => {
      const watermarkedPath = photo.watermarked_preview_url
      const previewPath = watermarkedPath ?? photo.preview_url
      const previewBucket: MediaBucket = watermarkedPath ? 'watermarked' : 'previews'
      const lightboxPath = watermarkedPath ?? photo.preview_url
      const lightboxBucket: MediaBucket = watermarkedPath ? 'watermarked' : 'previews'

      return {
        id: photo.id,
        preview_signed_url: previewPath
          ? await signPath(previewBucket, previewPath, galleryId)
          : null,
        lightbox_signed_url: lightboxPath
          ? await signPath(lightboxBucket, lightboxPath, galleryId)
          : null,
        width: photo.width,
        height: photo.height,
      }
    })
  )

  const heroPath = user?.hero_desktop_url || user?.hero_mobile_url
  const heroImageUrl = heroPath ? await signPath('branding', heroPath) : null
  const logoImageUrl = user?.logo_url ? await signPath('branding', user.logo_url) : null

  return {
    title: gallery.title,
    studioName: user?.studio_name ?? null,
    createdAt: gallery.created_at,
    photos: portfolioPhotos,
    accentColor: user?.accent_color ?? '#7c3aed',
    selectedTheme: user?.selected_theme ?? 'classic',
    heroImageUrl,
    logoImageUrl,
  }
}

export async function completeClientSelection(
  galleryId: string,
  selections: ClientSelectionPayload[],
  clientNote?: string
): Promise<GalleryActionResult> {
  const allowed = await touchGallerySession(galleryId)
  if (!allowed) {
    return {
      ok: false,
      expired: true,
      error:
        'פג תוקף החיבור לגלריה מרוב חוסר פעילות. הבחירות שלך נשמרו — יש להתחבר מחדש כדי לשלוח אותן.',
    }
  }

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
  if (!gallery) return { ok: false, error: 'הגלריה לא נמצאה' }
  if (!['selection'].includes(gallery.status)) {
    return {
      ok: false,
      error: 'שלב בחירת התמונות בגלריה זו כבר נסגר. פנו לצלם/ת אם צריך לשנות.',
    }
  }

  const { data: settingsData } = await admin
    .from('gallery_settings')
    .select(
      'max_album_selection, max_edit_selection, album_selection_enabled, edit_selection_enabled'
    )
    .eq('gallery_id', galleryId)
    .single()

  const settings = settingsData as {
    max_album_selection: number | null
    max_edit_selection: number | null
    album_selection_enabled: boolean
    edit_selection_enabled: boolean
  } | null

  const albumEnabled = settings?.album_selection_enabled ?? true
  const editEnabled = settings?.edit_selection_enabled ?? true

  // A disabled track has no UI, but drop anything that slips through anyway so
  // the photographer never sees selections for a track they turned off.
  const cleanSelections = selections.map((selection) => ({
    ...selection,
    selected_album: albumEnabled && selection.selected_album,
    selected_edit: editEnabled && selection.selected_edit,
  }))

  const limitError = checkSelectionLimits(
    cleanSelections,
    settings?.max_album_selection,
    settings?.max_edit_selection
  )
  if (limitError) return { ok: false, error: limitError }

  const { data: galleryPhotos } = await admin
    .from('photos')
    .select('id')
    .eq('gallery_id', galleryId)
    .eq('is_visible_to_client', true)

  const validPhotoIds = new Set(
    ((galleryPhotos ?? []) as { id: string }[]).map((photo) => photo.id)
  )

  const rows = cleanSelections
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
    if (error) {
      return { ok: false, error: 'שמירת הבחירות נכשלה. נסו שוב בעוד רגע.' }
    }
  }

  await admin
    .from('galleries')
    .update({ status: 'editing' } as never)
    .eq('id', galleryId)

  const albumCount = countSelections(cleanSelections, 'selected_album')
  const editCount = countSelections(cleanSelections, 'selected_edit')

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
    albumEnabled,
    editEnabled,
    clientNote: clientNote?.trim().slice(0, 2000) || undefined,
  })

  revalidatePath(`/g/${galleryId}`)
  revalidatePath(`/dashboard/galleries/${galleryId}`)
  return { ok: true }
}

export async function markDeliveryReady(galleryId: string) {
  const { userId, supabase } = await requireDashboardContext()

  const { data: owned } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .eq('user_id', userId)
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
