'use server'

import { revalidatePath } from 'next/cache'
import {
  adminCreateClient,
  adminDeleteClient,
  adminDeletePackage,
  adminEnsureGalleryClient,
  adminFetchSiteSettings,
  adminMarkImagesDeleting,
  adminUpsertAlbum,
  adminUpsertPackage,
  adminUpsertSiteSettings,
  siteSettingsRowToPayload,
  adminUpdateClient,
  type AlbumPayload,
  type ClientPayload,
  type PackagePayload,
  type SiteSettingsPayload,
} from '@/lib/admin-db'
import { invokeBulkDeleteImages } from '@/lib/bulk-delete-invoke'
import {
  siteStorageConfigError,
  siteStorageConfigured,
  uploadSiteFile,
} from '@/lib/albums-storage'
import { parseFormInt, parseFormIntOrNull } from '@/lib/numbers'
import {
  adminApproveTestimonial,
  adminDeleteTestimonial,
  adminRejectTestimonial,
  adminUnpublishTestimonial,
} from '@/lib/testimonials-db'
import { getPhotographerSession } from '@/lib/auth-helpers'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'
import { tenantPath } from '@/lib/tenant-paths'
import { parseThemeStyle } from '@/lib/theme-styles'

export type ActionResult = { ok: boolean; message: string; id?: string }

async function guard(): Promise<ActionResult | null> {
  if (!getAdminClient()) {
    return { ok: false, message: adminConfigError() }
  }
  const session = await getPhotographerSession()
  if (!session) {
    return { ok: false, message: 'נדרשת התחברות לסטודיו' }
  }
  return null
}

async function revalidateAdmin() {
  revalidatePath('/admin')
  revalidatePath('/', 'layout')
  revalidatePath('/')

  const session = await getPhotographerSession()
  const slug = session?.photographer.slug
  if (slug) {
    revalidatePath(tenantPath(slug), 'layout')
    revalidatePath(tenantPath(slug))
    revalidatePath(tenantPath(slug, '/client'))
    revalidatePath(tenantPath(slug, '/gallery'))
    revalidatePath(tenantPath(slug, '/contact'))
    revalidatePath(tenantPath(slug, '/pricing'))
  }
}

function testimonialIdFromForm(formData: FormData): string | null {
  const id = String(formData.get('testimonial_id') ?? '').trim()
  return id || null
}

function fileFromFormData(formData: FormData, name: string): File | null {
  const value = formData.get(name)
  if (value instanceof File && value.size > 0) return value
  return null
}

async function uploadedMediaUrl(
  formData: FormData,
  fileField: string,
  prefix: string,
  fallback: string
): Promise<{ url: string; error: string | null }> {
  const file = fileFromFormData(formData, fileField)
  if (!file) return { url: fallback, error: null }

  if (!siteStorageConfigured()) {
    return { url: fallback, error: siteStorageConfigError() }
  }

  const { url, error } = await uploadSiteFile(file, prefix)
  if (error) return { url: fallback, error }
  return { url: url ?? fallback, error: null }
}

export async function saveSiteSettingsAction(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const settingsId = String(formData.get('settings_id') ?? '').trim() || null
  const existing = settingsId || id ? await adminFetchSiteSettings() : null

  const logoFromForm = String(formData.get('logo_url') ?? '').trim()
  const heroFromForm = String(formData.get('hero_image_url') ?? '').trim()
  const heroMobileFromForm = String(
    formData.get('hero_image_url_mobile') ?? ''
  ).trim()
  const aboutFromForm = String(formData.get('about_image_url') ?? '').trim()

  const logoUpload = await uploadedMediaUrl(
    formData,
    'logo_file',
    'logo',
    logoFromForm || existing?.logo_url || ''
  )
  if (logoUpload.error) return { ok: false, message: logoUpload.error }

  const heroUpload = await uploadedMediaUrl(
    formData,
    'hero_file',
    'hero',
    heroFromForm || existing?.hero_image_url || ''
  )
  if (heroUpload.error) return { ok: false, message: heroUpload.error }

  const heroMobileUpload = await uploadedMediaUrl(
    formData,
    'hero_file_mobile',
    'hero-mobile',
    heroMobileFromForm || existing?.hero_image_url_mobile || ''
  )
  if (heroMobileUpload.error) return { ok: false, message: heroMobileUpload.error }

  const aboutUpload = await uploadedMediaUrl(
    formData,
    'about_file',
    'about',
    aboutFromForm || existing?.about_image_url || ''
  )
  if (aboutUpload.error) return { ok: false, message: aboutUpload.error }

  const payload: SiteSettingsPayload = {
    business_name: String(formData.get('business_name') ?? ''),
    tagline: String(formData.get('tagline') ?? ''),
    about_text: String(formData.get('about_text') ?? ''),
    about_headline_line1: String(formData.get('about_headline_line1') ?? ''),
    about_headline_line2: String(formData.get('about_headline_line2') ?? ''),
    about_quote: String(formData.get('about_quote') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    whatsapp: String(formData.get('whatsapp') ?? ''),
    years_experience: parseFormInt(formData.get('years_experience')),
    total_clients: parseFormInt(formData.get('total_clients')),
    total_projects: parseFormInt(formData.get('total_projects')),
    primary_color: String(formData.get('primary_color') ?? ''),
    secondary_color: String(formData.get('secondary_color') ?? ''),
    hero_image_url: heroUpload.url,
    hero_image_url_mobile: heroMobileUpload.url,
    about_image_url: aboutUpload.url,
    logo_url: logoUpload.url,
    theme_style: parseThemeStyle(
      String(formData.get('theme_style') ?? existing?.theme_style ?? 'warm')
    ),
  }

  const { error } = await adminUpsertSiteSettings(settingsId ?? id, payload)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'הגדרות האתר נשמרו בהצלחה' }
}

export async function saveThemePreferencesAction(
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const settingsId = String(formData.get('settings_id') ?? '').trim() || null
  const existing = await adminFetchSiteSettings()
  if (!existing) {
    return { ok: false, message: 'לא נמצאו הגדרות אתר' }
  }

  const payload: SiteSettingsPayload = {
    ...siteSettingsRowToPayload(existing),
    theme_style: parseThemeStyle(
      String(formData.get('theme_style') ?? existing.theme_style ?? 'warm')
    ),
    primary_color: String(formData.get('primary_color') ?? ''),
    secondary_color: String(formData.get('secondary_color') ?? ''),
  }

  const { error } = await adminUpsertSiteSettings(settingsId ?? existing.id, payload)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'ערכת העיצוב נשמרה' }
}

export async function saveAlbumAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const resolvedId = String(formData.get('album_id') ?? '').trim() || null

  let client_id = String(formData.get('client_id') ?? '').trim()
  if (!client_id) {
    const fallback = await adminEnsureGalleryClient()
    if (!fallback) {
      return {
        ok: false,
        message: 'יש לבחור לקוח או ליצור לקוח בלשונית "לקוחות"',
      }
    }
    client_id = fallback
  }

  const payload: AlbumPayload = {
    client_id,
    title: String(formData.get('title') ?? ''),
    cover_image: String(formData.get('cover_image') ?? '').trim(),
    status: String(formData.get('status') ?? 'draft'),
    is_public: formData.get('is_public') === 'on',
    expires_at: String(formData.get('expires_at') ?? ''),
    max_album_selections: parseFormIntOrNull(formData.get('max_album_selections')),
    max_edit_selections: parseFormIntOrNull(formData.get('max_edit_selections')),
  }

  const { error, id: savedId } = await adminUpsertAlbum(resolvedId, payload)
  if (error) return { ok: false, message: error }

  const albumId = savedId ?? resolvedId
  if (!albumId) {
    return { ok: false, message: 'שגיאה בשמירת הגלריה' }
  }

  await revalidateAdmin()
  return {
    ok: true,
    message: resolvedId ? 'הגלריה עודכנה' : 'גלריה חדשה נוצרה',
    id: albumId,
  }
}

export async function uploadAlbumImagesAction(): Promise<ActionResult> {
  return {
    ok: false,
    message:
      'העלאת תמונות גלריה מתבצעת מהדפדפן ל-Cloudflare R2 — השתמשי בטופס בעריכת הגלריה',
  }
}

export async function deleteImageAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const imageId = String(formData.get('image_id') ?? '').trim()
  const albumId = String(formData.get('album_id') ?? '').trim()
  if (!imageId) return { ok: false, message: 'חסר מזהה תמונה' }
  if (!albumId) return { ok: false, message: 'חסר מזהה גלריה' }

  const { error: markError, markedCount } = await adminMarkImagesDeleting(
    albumId,
    [imageId]
  )
  if (markError) return { ok: false, message: markError }
  if (markedCount === 0) {
    return { ok: false, message: 'התמונה לא נמצאה או כבר נמחקת' }
  }

  const { error } = await invokeBulkDeleteImages({
    mode: 'images',
    albumId,
    imageIds: [imageId],
  })
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'התמונה נמחקת — המחיקה מתבצעת ברקע' }
}

export async function deleteAllAlbumImagesAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const albumId = String(formData.get('album_id') ?? '').trim()
  if (!albumId) return { ok: false, message: 'חסר מזהה גלריה' }

  const { error: markError, markedCount } = await adminMarkImagesDeleting(albumId)
  if (markError) return { ok: false, message: markError }
  if (markedCount === 0) {
    return { ok: true, message: 'אין תמונות למחיקה בגלריה זו' }
  }

  const { error } = await invokeBulkDeleteImages({ mode: 'all', albumId })
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  const countLabel = markedCount.toLocaleString('he-IL')
  return {
    ok: true,
    message:
      markedCount === 1
        ? 'התמונה נמחקת — המחיקה מתבצעת ברקע'
        : `${countLabel} תמונות נמחקות — המחיקה מתבצעת ברקע`,
  }
}

export async function bulkDeleteImagesAction(
  albumId: string,
  imageIds: string[]
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const cleanAlbumId = albumId.trim()
  if (!cleanAlbumId) return { ok: false, message: 'חסר מזהה גלריה' }

  const uniqueIds = [
    ...new Set(imageIds.map((id) => id.trim()).filter(Boolean)),
  ]
  if (uniqueIds.length === 0) {
    return { ok: false, message: 'לא נבחרו תמונות למחיקה' }
  }

  const { error: markError, markedCount } = await adminMarkImagesDeleting(
    cleanAlbumId,
    uniqueIds
  )
  if (markError) return { ok: false, message: markError }
  if (markedCount === 0) {
    return { ok: false, message: 'לא נמצאו תמונות למחיקה' }
  }

  const { error } = await invokeBulkDeleteImages({
    mode: 'images',
    albumId: cleanAlbumId,
    imageIds: uniqueIds,
  })
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  const countLabel = markedCount.toLocaleString('he-IL')
  return {
    ok: true,
    message:
      markedCount === 1
        ? 'התמונה נמחקת — המחיקה מתבצעת ברקע'
        : `${countLabel} תמונות נמחקות — המחיקה מתבצעת ברקע`,
  }
}

export async function deleteAlbumAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const id = String(formData.get('album_id') ?? '').trim()
  if (!id) return { ok: false, message: 'חסר מזהה גלריה' }

  await adminMarkImagesDeleting(id)

  const { error } = await invokeBulkDeleteImages({ mode: 'album', albumId: id })
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return {
    ok: true,
    message: 'הגלריה נמחקה, כולל כל התמונות מ-R2',
  }
}

export async function savePackageAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const resolvedId = String(formData.get('package_id') ?? '').trim() || null

  const features = String(formData.get('features') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const payload: PackagePayload = {
    title: String(formData.get('title') ?? '').trim(),
    price: parseFormIntOrNull(formData.get('price')),
    description: String(formData.get('description') ?? '').trim(),
    features,
    is_featured: formData.get('is_featured') === 'on',
    is_active: formData.get('is_active') === 'on',
    sort_order: parseFormInt(formData.get('sort_order')),
  }

  if (!payload.title) {
    return { ok: false, message: 'יש להזין שם חבילה' }
  }

  const { error, id } = await adminUpsertPackage(resolvedId, payload)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return {
    ok: true,
    message: resolvedId ? 'החבילה עודכנה' : 'חבילה חדשה נוצרה',
    id: id ?? undefined,
  }
}

export async function deletePackageAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const id = String(formData.get('package_id') ?? '').trim()
  if (!id) return { ok: false, message: 'חסר מזהה חבילה' }

  const { error } = await adminDeletePackage(id)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'החבילה נמחקה' }
}

export async function saveClientAction(
  clientId: string | null,
  userId: string | null,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const payload: ClientPayload = {
    full_name: String(formData.get('full_name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    access_code: String(formData.get('access_code') ?? ''),
  }

  if (clientId && userId) {
    const { error } = await adminUpdateClient(clientId, userId, payload)
    if (error) return { ok: false, message: error }
    await revalidateAdmin()
    return { ok: true, message: 'פרטי הלקוח עודכנו' }
  }

  const { error } = await adminCreateClient(payload)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'לקוח חדש נוסף' }
}

export async function deleteClientAction(
  clientId: string,
  userId: string
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const { error } = await adminDeleteClient(clientId, userId)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'הלקוח נמחק' }
}

export async function approveTestimonialAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const id = testimonialIdFromForm(formData)
  if (!id) return { ok: false, message: 'חסר מזהה המלצה' }

  const { error } = await adminApproveTestimonial(id)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'ההמלצה אושרה ומוצגת בדף הבית' }
}

export async function rejectTestimonialAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const id = testimonialIdFromForm(formData)
  if (!id) return { ok: false, message: 'חסר מזהה המלצה' }

  const { error } = await adminRejectTestimonial(id)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'ההמלצה נדחתה' }
}

export async function unpublishTestimonialAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const id = testimonialIdFromForm(formData)
  if (!id) return { ok: false, message: 'חסר מזהה המלצה' }

  const { error } = await adminUnpublishTestimonial(id)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'ההמלצה הוסרה מדף הבית' }
}

export async function deleteTestimonialAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const blocked = await guard()
  if (blocked) return blocked

  const id = testimonialIdFromForm(formData)
  if (!id) return { ok: false, message: 'חסר מזהה המלצה' }

  const { error } = await adminDeleteTestimonial(id)
  if (error) return { ok: false, message: error }

  await revalidateAdmin()
  return { ok: true, message: 'ההמלצה נמחקה' }
}
