'use server'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database.types'
import { isR2Configured } from '@/lib/r2/config'
import { createPresignedUploadUrl } from '@/lib/r2/storage'
import {
  PRIMARY_IMAGE_MAX_BYTES,
  validatePrimaryImageFile,
} from '@/lib/media-upload-limits'

const HERO_SLOT_COUNT = 3

type BrandingImageType =
  | 'logo'
  | 'hero_desktop'
  | 'hero_mobile'
  | 'about'
  | 'contact_desktop'
  | 'contact_mobile'
  | 'packages_desktop'
  | 'packages_mobile'

function validateBrandingFile(contentType: string, fileSize: number) {
  validatePrimaryImageFile(contentType, fileSize)
}

function validateHeroSlot(slot: number | undefined) {
  if (slot === undefined) return
  if (!Number.isInteger(slot) || slot < 0 || slot >= HERO_SLOT_COUNT) {
    throw new Error('מספר תמונת הירו לא תקין')
  }
}

function brandingPathForUser(
  userId: string,
  type: BrandingImageType,
  fileName: string,
  slot?: number
) {
  const extension = fileName.split('.').pop()
  const slotSuffix =
    (type === 'hero_desktop' || type === 'hero_mobile') && slot !== undefined
      ? `_${slot + 1}`
      : ''
  return `${userId}/${type}${slotSuffix}_${Date.now()}.${extension}`
}

type UsersUpdate = Database['public']['Tables']['users']['Update']

function normalizeHeroSlots(
  urls: string[] | null | undefined,
  legacyUrl?: string | null
) {
  const slots = ['', '', '']
  const source =
    urls && urls.length > 0
      ? urls
      : legacyUrl
        ? [extractStoragePath(legacyUrl)]
        : []

  source.slice(0, HERO_SLOT_COUNT).forEach((path, index) => {
    if (path) slots[index] = extractStoragePath(path)
  })
  return slots
}

function extractStoragePath(pathOrUrl: string) {
  if (!pathOrUrl.startsWith('http://') && !pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const match = pathOrUrl.match(/\/branding\/([^?]+)/)
  return match ? match[1] : pathOrUrl
}

function slotsToPersistedArray(slots: string[]) {
  return slots.slice(0, HERO_SLOT_COUNT).map((slot) => slot || '')
}

function buildHeroUpdate(
  arrayField: 'hero_desktop_urls' | 'hero_mobile_urls',
  legacyField: 'hero_desktop_url' | 'hero_mobile_url',
  slots: string[]
): UsersUpdate {
  return {
    [arrayField]: slotsToPersistedArray(slots),
    [legacyField]: firstHeroPath(slots),
  } as UsersUpdate
}

function coerceHeroSlot(slot: number | undefined) {
  if (slot === undefined || slot === null) return undefined
  const normalized = typeof slot === 'number' ? slot : Number(slot)
  validateHeroSlot(normalized)
  return normalized
}

function firstHeroPath(slots: string[]) {
  return slots.find(Boolean) || null
}

export async function prepareBrandingUpload(input: {
  type: BrandingImageType
  fileName: string
  contentType: string
  fileSize: number
  slot?: number
}) {
  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  const { userId } = await requireDashboardContext()

  validateBrandingFile(input.contentType, input.fileSize)
  const slot = coerceHeroSlot(input.slot)

  const path = brandingPathForUser(userId, input.type, input.fileName, slot)
  const uploadUrl = await createPresignedUploadUrl('branding', path, input.contentType)

  return { uploadUrl, path, slot }
}

export async function finalizeBrandingUpload(
  type: BrandingImageType,
  path: string,
  slot?: number
) {
  const { userId, supabase } = await requireDashboardContext()
  if (!path.startsWith(`${userId}/`)) {
    throw new Error('נתיב קובץ לא תקין')
  }

  const updateData: UsersUpdate = {}

  if (type === 'logo') updateData.logo_url = path
  if (type === 'about') updateData.about_image_url = path
  if (type === 'contact_desktop') updateData.contact_desktop_url = path
  if (type === 'contact_mobile') updateData.contact_mobile_url = path
  if (type === 'packages_desktop') updateData.packages_desktop_url = path
  if (type === 'packages_mobile') updateData.packages_mobile_url = path

  if (type === 'hero_desktop' || type === 'hero_mobile') {
    const heroSlot = coerceHeroSlot(slot)
    if (heroSlot === undefined) {
      throw new Error('יש לבחור מיקום לתמונת הירו')
    }

    const arrayField =
      type === 'hero_desktop' ? 'hero_desktop_urls' : 'hero_mobile_urls'
    const legacyField =
      type === 'hero_desktop' ? 'hero_desktop_url' : 'hero_mobile_url'

    const admin = createAdminClient()
    const { data: profile, error: readError } = await admin
      .from('users')
      .select(`${arrayField}, ${legacyField}`)
      .eq('id', userId)
      .single()

    if (readError) {
      console.error('[finalizeBrandingUpload] read failed', readError)
      throw new Error(readError.message)
    }

    const row = profile as Record<string, string[] | string | null> | null
    const slots = normalizeHeroSlots(
      row?.[arrayField] as string[] | null | undefined,
      row?.[legacyField] as string | null | undefined
    )
    slots[heroSlot] = path

    Object.assign(updateData, buildHeroUpdate(arrayField, legacyField, slots))
  }

  const writeClient = createAdminClient()

  const { error } = await writeClient
    .from('users')
    .update(updateData as never)
    .eq('id', userId)

  if (error) {
    console.error('[finalizeBrandingUpload] update failed', error, updateData)
    throw new Error(error.message)
  }

  return { success: true, path, slot }
}

export async function removeHeroImageSlot(input: {
  variant: 'desktop' | 'mobile'
  slot: number
}) {
  validateHeroSlot(input.slot)

  const { userId } = await requireDashboardContext()

  const arrayField =
    input.variant === 'desktop' ? 'hero_desktop_urls' : 'hero_mobile_urls'
  const legacyField =
    input.variant === 'desktop' ? 'hero_desktop_url' : 'hero_mobile_url'

  const admin = createAdminClient()
  const { data: profile, error: readError } = await admin
    .from('users')
    .select(`${arrayField}, ${legacyField}`)
    .eq('id', userId)
    .single()

  if (readError) throw new Error(readError.message)

  const row = profile as Record<string, string[] | string | null> | null
  const slots = normalizeHeroSlots(
    row?.[arrayField] as string[] | null | undefined,
    row?.[legacyField] as string | null | undefined
  )
  slots[input.slot] = ''

  const { error } = await admin
    .from('users')
    .update(buildHeroUpdate(arrayField, legacyField, slots))
    .eq('id', userId)

  if (error) throw new Error(error.message)

  return { success: true }
}

type SingleBrandingImageType = Exclude<
  BrandingImageType,
  'hero_desktop' | 'hero_mobile'
>

const SINGLE_BRANDING_FIELD: Record<
  SingleBrandingImageType,
  keyof UsersUpdate
> = {
  logo: 'logo_url',
  about: 'about_image_url',
  contact_desktop: 'contact_desktop_url',
  contact_mobile: 'contact_mobile_url',
  packages_desktop: 'packages_desktop_url',
  packages_mobile: 'packages_mobile_url',
}

export async function removeBrandingImage(type: SingleBrandingImageType) {
  const { userId } = await requireDashboardContext()

  const field = SINGLE_BRANDING_FIELD[type]
  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ [field]: null } as UsersUpdate)
    .eq('id', userId)

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function updateBrandingSettings(data: {
  studioName?: string
  aboutText?: string
  statProjects?: number
  statClients?: number
  statExperienceYears?: number
  accentColor?: string
  selectedTheme?: string
  heroDesktopUrl?: string
  heroMobileUrl?: string
  heroDesktopUrls?: string[]
  heroMobileUrls?: string[]
  aboutImageUrl?: string
  contactDesktopUrl?: string
  contactMobileUrl?: string
  packagesDesktopUrl?: string
  packagesMobileUrl?: string
  shouldColorLogo?: boolean
}) {
  const { userId } = await requireDashboardContext()

  const updateData: Record<string, any> = {}

  if (data.studioName !== undefined) updateData.studio_name = data.studioName
  if (data.aboutText !== undefined) updateData.about_text = data.aboutText
  if (data.statProjects !== undefined) updateData.stat_projects = data.statProjects
  if (data.statClients !== undefined) updateData.stat_clients = data.statClients
  if (data.statExperienceYears !== undefined)
    updateData.stat_experience_years = data.statExperienceYears
  if (data.accentColor !== undefined) updateData.accent_color = data.accentColor
  if (data.selectedTheme !== undefined) updateData.selected_theme = data.selectedTheme
  if (data.heroDesktopUrl !== undefined) updateData.hero_desktop_url = data.heroDesktopUrl
  if (data.heroMobileUrl !== undefined) updateData.hero_mobile_url = data.heroMobileUrl
  if (data.heroDesktopUrls !== undefined) {
    const slots = data.heroDesktopUrls.slice(0, HERO_SLOT_COUNT).map((url) => url || '')
    updateData.hero_desktop_urls = slots
    updateData.hero_desktop_url = slots.find(Boolean) ?? null
  }
  if (data.heroMobileUrls !== undefined) {
    const slots = data.heroMobileUrls.slice(0, HERO_SLOT_COUNT).map((url) => url || '')
    updateData.hero_mobile_urls = slots
    updateData.hero_mobile_url = slots.find(Boolean) ?? null
  }
  if (data.aboutImageUrl !== undefined) updateData.about_image_url = data.aboutImageUrl
  if (data.contactDesktopUrl !== undefined)
    updateData.contact_desktop_url = data.contactDesktopUrl
  if (data.contactMobileUrl !== undefined)
    updateData.contact_mobile_url = data.contactMobileUrl
  if (data.packagesDesktopUrl !== undefined)
    updateData.packages_desktop_url = data.packagesDesktopUrl
  if (data.packagesMobileUrl !== undefined)
    updateData.packages_mobile_url = data.packagesMobileUrl
  if (data.shouldColorLogo !== undefined) updateData.should_color_logo = data.shouldColorLogo

  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update(updateData as never)
    .eq('id', userId)

  if (error) throw new Error(error.message)

  return { success: true }
}
