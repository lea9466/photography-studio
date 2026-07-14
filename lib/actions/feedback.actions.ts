'use server'

import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordSlugRedirect } from '@/lib/referral/slug-redirect'
import { sendFeedbackEmail } from '@/lib/email/resend'
import { validatePrimaryImageFile } from '@/lib/media-upload-limits'
import { isR2Configured } from '@/lib/r2/config'
import { createPresignedUploadUrl } from '@/lib/r2/storage'
import { formatTestimonialImageRef } from '@/lib/testimonial-image-url'
import type { Database, FeedbackType } from '@/lib/types/database.types'
import { HEX_COLOR_REGEX } from '@/lib/color'
import { THEME_IDS } from '@/lib/dashboard/site-settings-help'
import { assertOwnedBrandingRef } from '@/lib/branding-preview-url'

type UsersUpdate = Database['public']['Tables']['users']['Update']

type UpdateProfileInput = {
  name?: string
  studio_name?: string
  theme_primary?: string
  about_text?: string
  about_title?: string
  about_subtitle?: string
  about_description?: string
  contact_card_title?: string
  contact_card_description?: string
  address?: string | null
  stat_projects?: number
  stat_clients?: number
  stat_experience_years?: number
  accent_color?: string
  selected_theme?: string
  logo_url?: string
  hero_desktop_url?: string
  hero_mobile_url?: string
  hero_desktop_urls?: string[]
  hero_mobile_urls?: string[]
  about_image_url?: string
  contact_desktop_url?: string
  contact_mobile_url?: string
  packages_desktop_url?: string
  packages_mobile_url?: string
  packages_title?: string
  packages_subtitle?: string
  phone?: string | null
  email?: string | null
  slug?: string
  should_color_logo?: boolean
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed || null
}

function buildProfileUpdateData(userId: string, input: UpdateProfileInput): UsersUpdate {
  const updateData: UsersUpdate = {}

  if (input.name !== undefined) updateData.name = normalizeOptionalText(input.name) ?? null
  if (input.studio_name !== undefined) {
    updateData.studio_name = normalizeOptionalText(input.studio_name) ?? null
  }
  if (input.theme_primary !== undefined) {
    // theme_primary stores a hex color value (kept in sync with accent_color
    // by the dashboard forms), not a theme id — validate it as a color.
    if (!HEX_COLOR_REGEX.test(input.theme_primary.trim())) {
      throw new Error('צבע לא תקין — יש להזין קוד צבע (HEX) תקין')
    }
    updateData.theme_primary = input.theme_primary.trim()
  }
  if (input.about_text !== undefined) {
    updateData.about_text = normalizeOptionalText(input.about_text) ?? null
  }
  if (input.about_title !== undefined) {
    updateData.about_title = normalizeOptionalText(input.about_title) ?? null
  }
  if (input.about_subtitle !== undefined) {
    updateData.about_subtitle = normalizeOptionalText(input.about_subtitle) ?? null
  }
  if (input.about_description !== undefined) {
    updateData.about_description = normalizeOptionalText(input.about_description) ?? null
  }
  if (input.contact_card_title !== undefined) {
    updateData.contact_card_title = normalizeOptionalText(input.contact_card_title) ?? null
  }
  if (input.contact_card_description !== undefined) {
    updateData.contact_card_description =
      normalizeOptionalText(input.contact_card_description) ?? null
  }
  if (input.address !== undefined) updateData.address = normalizeOptionalText(input.address) ?? null
  if (input.phone !== undefined) updateData.phone = normalizeOptionalText(input.phone) ?? null
  if (input.email !== undefined) updateData.email = normalizeOptionalText(input.email) ?? null
  if (input.stat_projects !== undefined) updateData.stat_projects = input.stat_projects
  if (input.stat_clients !== undefined) updateData.stat_clients = input.stat_clients
  if (input.stat_experience_years !== undefined) {
    updateData.stat_experience_years = input.stat_experience_years
  }
  if (input.accent_color !== undefined) {
    if (!HEX_COLOR_REGEX.test(input.accent_color.trim())) {
      throw new Error('צבע לא תקין — יש להזין קוד צבע (HEX) תקין')
    }
    updateData.accent_color = input.accent_color.trim()
  }
  if (input.selected_theme !== undefined) {
    if (!THEME_IDS.includes(input.selected_theme as (typeof THEME_IDS)[number])) {
      throw new Error('ערכת עיצוב לא תקינה')
    }
    updateData.selected_theme = input.selected_theme
  }
  if (input.logo_url !== undefined) {
    assertOwnedBrandingRef(userId, input.logo_url)
    updateData.logo_url = input.logo_url || null
  }
  if (input.hero_desktop_url !== undefined) {
    assertOwnedBrandingRef(userId, input.hero_desktop_url)
    updateData.hero_desktop_url = input.hero_desktop_url || null
  }
  if (input.hero_mobile_url !== undefined) {
    assertOwnedBrandingRef(userId, input.hero_mobile_url)
    updateData.hero_mobile_url = input.hero_mobile_url || null
  }
  if (input.hero_desktop_urls !== undefined) {
    input.hero_desktop_urls.forEach((url) => assertOwnedBrandingRef(userId, url))
    updateData.hero_desktop_urls = input.hero_desktop_urls.slice(0, 3)
    updateData.hero_desktop_url = input.hero_desktop_urls.find(Boolean) ?? null
  }
  if (input.hero_mobile_urls !== undefined) {
    input.hero_mobile_urls.forEach((url) => assertOwnedBrandingRef(userId, url))
    updateData.hero_mobile_urls = input.hero_mobile_urls.slice(0, 3)
    updateData.hero_mobile_url = input.hero_mobile_urls.find(Boolean) ?? null
  }
  if (input.about_image_url !== undefined) {
    assertOwnedBrandingRef(userId, input.about_image_url)
    updateData.about_image_url = input.about_image_url || null
  }
  if (input.contact_desktop_url !== undefined) {
    assertOwnedBrandingRef(userId, input.contact_desktop_url)
    updateData.contact_desktop_url = input.contact_desktop_url || null
  }
  if (input.contact_mobile_url !== undefined) {
    assertOwnedBrandingRef(userId, input.contact_mobile_url)
    updateData.contact_mobile_url = input.contact_mobile_url || null
  }
  if (input.packages_desktop_url !== undefined) {
    assertOwnedBrandingRef(userId, input.packages_desktop_url)
    updateData.packages_desktop_url = input.packages_desktop_url || null
  }
  if (input.packages_mobile_url !== undefined) {
    assertOwnedBrandingRef(userId, input.packages_mobile_url)
    updateData.packages_mobile_url = input.packages_mobile_url || null
  }
  if (input.packages_title !== undefined) {
    updateData.packages_title = normalizeOptionalText(input.packages_title) ?? null
  }
  if (input.packages_subtitle !== undefined) {
    updateData.packages_subtitle = normalizeOptionalText(input.packages_subtitle) ?? null
  }
  if (input.slug !== undefined) updateData.slug = input.slug.trim() || null
  if (input.should_color_logo !== undefined) {
    updateData.should_color_logo = input.should_color_logo
  }

  return updateData
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function prepareFeedbackImageUpload(input: {
  fileName: string
  contentType: string
  fileSize: number
}) {
  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  const { userId } = await requireDashboardContext()

  if (!ALLOWED_IMAGE_TYPES.includes(input.contentType)) {
    throw new Error('סוג הקובץ לא נתמך — JPG, PNG או WebP')
  }
  validatePrimaryImageFile(input.contentType, input.fileSize)

  const extension = input.fileName.split('.').pop() || 'jpg'
  const path = `${userId}/feedback_${Date.now()}.${extension}`
  const uploadUrl = await createPresignedUploadUrl('branding', path, input.contentType)

  return {
    uploadUrl,
    storageRef: formatTestimonialImageRef('branding', path),
  }
}

const FEEDBACK_TYPES: FeedbackType[] = ['משוב', 'תקלה', 'פיצ׳ר', 'אחר']

export async function submitFeedback(input: {
  type: FeedbackType
  name: string
  email: string
  message: string
  studio?: string
  imageUrl?: string | null
}) {
  if (!FEEDBACK_TYPES.includes(input.type)) {
    throw new Error('סוג פנייה לא תקין')
  }

  const admin = createAdminClient()
  const imageUrl = input.imageUrl?.trim() || null

  const { error } = await admin.from('feedback').insert({
    type: input.type,
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    studio: input.studio?.trim() || null,
    image_url: imageUrl,
  } as never)

  if (error) throw new Error(error.message)

  await sendFeedbackEmail({ ...input, imageUrl })
  revalidatePath('/')
  revalidatePath('/dashboard/contact')
  return { success: true }
}

export async function updateProfile(input: UpdateProfileInput) {
  const { userId, supabase, actorEmail } = await requireDashboardContext()

  const updateData = buildProfileUpdateData(userId, input)
  if (Object.keys(updateData).length === 0) return

  if (input.slug !== undefined) {
    const { data: current } = await supabase
      .from('users')
      .select('slug')
      .eq('id', userId)
      .maybeSingle()

    const oldSlug = (current as { slug: string | null } | null)?.slug?.trim()
    const newSlug = input.slug.trim()

    if (oldSlug && newSlug && oldSlug !== newSlug) {
      await recordSlugRedirect(oldSlug, newSlug)
    }
  }

  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!existingProfile) {
    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      email: updateData.email ?? actorEmail ?? null,
      show_welcome_popup: true,
      ...updateData,
    } as never)

    if (insertError) throw new Error(insertError.message)
  } else {
    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData as never)
      .eq('id', userId)
      .select('id, phone, email')
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('העדכון לא נשמר — נסי להתחבר מחדש')
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  revalidatePath('/g/[id]', 'page')
  revalidatePath('/portfolio/[slug]', 'page')
  revalidatePath('/[slug]', 'page')
}
