import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database.types'

export type PublicPhotographer = Pick<
  Database['public']['Tables']['users']['Row'],
  | 'id'
  | 'name'
  | 'studio_name'
  | 'slug'
  | 'logo_url'
  | 'about_text'
  | 'about_title'
  | 'about_subtitle'
  | 'about_description'
  | 'contact_card_title'
  | 'contact_card_description'
  | 'address'
  | 'phone'
  | 'stat_projects'
  | 'stat_clients'
  | 'stat_experience_years'
  | 'accent_color'
  | 'selected_theme'
  | 'heading_font'
  | 'about_title_font'
  | 'hero_desktop_url'
  | 'hero_mobile_url'
  | 'hero_desktop_urls'
  | 'hero_mobile_urls'
  | 'about_image_url'
  | 'contact_desktop_url'
  | 'contact_mobile_url'
  | 'packages_desktop_url'
  | 'packages_mobile_url'
  | 'packages_title'
  | 'packages_subtitle'
  | 'contact_title'
  | 'contact_subtitle'
  | 'testimonials_title'
  | 'galleries_title'
  | 'recent_photos_title'
  | 'posts_page_title'
  | 'testimonial_layout_type'
  | 'gallery_layout_mode'
  | 'email'
  | 'faq_items'
  | 'faq_section_image_url'
  | 'should_color_logo'
  | 'site_language'
>

export const PHOTOGRAPHER_PUBLIC_FIELDS = `
  id,
  name,
  studio_name,
  slug,
  logo_url,
  about_text,
  about_title,
  about_subtitle,
  about_description,
  contact_card_title,
  contact_card_description,
  address,
  phone,
  stat_projects,
  stat_clients,
  stat_experience_years,
  accent_color,
  selected_theme,
  heading_font,
  about_title_font,
  hero_desktop_url,
  hero_mobile_url,
  hero_desktop_urls,
  hero_mobile_urls,
  about_image_url,
  contact_desktop_url,
  contact_mobile_url,
  packages_desktop_url,
  packages_mobile_url,
  packages_title,
  packages_subtitle,
  contact_title,
  contact_subtitle,
  testimonials_title,
  galleries_title,
  recent_photos_title,
  posts_page_title,
  testimonial_layout_type,
  gallery_layout_mode,
  email,
  faq_items,
  faq_section_image_url,
  should_color_logo,
  site_language
`

const RESERVED_SLUGS = new Set(['favicon.ico', 'robots.txt', 'sitemap.xml'])

function isDbPermissionError(code?: string) {
  return code === '42501' || code === 'PGRST301'
}

function formatDbError(error: unknown) {
  if (error && typeof error === 'object') {
    const dbError = error as { message?: string; details?: string; hint?: string; code?: string }
    const formatted = {
      code: dbError.code ?? null,
      message: dbError.message ?? null,
      details: dbError.details ?? null,
      hint: dbError.hint ?? null,
    }

    if (formatted.code || formatted.message || formatted.details || formatted.hint) {
      return formatted
    }
  }

  return { raw: String(error) }
}

function isMissingColumnError(error: { message?: string; code?: string }) {
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const message = error.message?.toLowerCase() ?? ''
  return (
    message.includes('contact_desktop_url') ||
    message.includes('contact_mobile_url') ||
    message.includes('packages_desktop_url') ||
    message.includes('packages_mobile_url') ||
    message.includes('packages_title') ||
    message.includes('packages_subtitle') ||
    message.includes('contact_title') ||
    message.includes('contact_subtitle') ||
    message.includes('galleries_title') ||
    message.includes('recent_photos_title') ||
    message.includes('faq_items') ||
    message.includes('faq_section_image_url') ||
    message.includes('gallery_layout_mode') ||
    message.includes('site_language') ||
    message.includes('heading_font') ||
    message.includes('about_title_font')
  )
}

function stripPortfolioLayoutFields(fields: string) {
  const optionalColumns = [
    'gallery_layout_mode',
    'site_language',
    'heading_font',
    'about_title_font',
    'packages_title',
    'packages_subtitle',
    'contact_title',
    'contact_subtitle',
  ]
  return fields
    .split('\n')
    .filter((line) => !optionalColumns.some((column) => line.includes(column)))
    .join('\n')
}

function withDefaultGalleryLayoutMode(
  photographer: Omit<
    PublicPhotographer,
    'gallery_layout_mode' | 'site_language' | 'heading_font' | 'about_title_font'
  > & {
    gallery_layout_mode?: PublicPhotographer['gallery_layout_mode']
    site_language?: PublicPhotographer['site_language']
    heading_font?: PublicPhotographer['heading_font']
    about_title_font?: PublicPhotographer['about_title_font']
  }
): PublicPhotographer {
  return {
    ...photographer,
    gallery_layout_mode: photographer.gallery_layout_mode ?? 'separated',
    site_language: photographer.site_language ?? 'he',
    heading_font: photographer.heading_font ?? null,
    about_title_font: photographer.about_title_font ?? null,
  }
}

function getMissingColumnMigrationHint(error: { message?: string }) {
  const message = error.message?.toLowerCase() ?? ''

  if (message.includes('packages_title') || message.includes('packages_subtitle')) {
    return 'Run migration add_packages_section_headings on Supabase.'
  }
  if (message.includes('contact_title') || message.includes('contact_subtitle')) {
    return 'Run migration 20250714000001_add_contact_section_headings.sql on Supabase.'
  }
  if (message.includes('faq_items') || message.includes('faq_section_image_url')) {
    return 'Run migration add_faq_section_image on Supabase.'
  }
  if (message.includes('packages_desktop_url') || message.includes('packages_mobile_url')) {
    return 'Run migration add_packages_background_images on Supabase.'
  }
  if (message.includes('contact_desktop_url') || message.includes('contact_mobile_url')) {
    return 'Run migration add_contact_background_images on Supabase.'
  }
  if (message.includes('gallery_layout_mode')) {
    return 'Run migration 20250711000001_add_portfolio_layout.sql on Supabase.'
  }
  if (message.includes('site_language')) {
    return 'Run migration 20250712000003_add_site_language.sql on Supabase.'
  }
  if (message.includes('heading_font') || message.includes('about_title_font')) {
    return 'Run migration 20250720000001_add_heading_fonts.sql on Supabase.'
  }

  return 'Apply pending Supabase migrations (supabase db push).'
}

export async function findPhotographerBySlug(decodedSlug: string): Promise<PublicPhotographer | null> {
  const normalizedSlug = decodedSlug.trim()
  if (!normalizedSlug || RESERVED_SLUGS.has(normalizedSlug)) {
    return null
  }

  const admin = createAdminClient()

  async function lookupBySlug(fields: string) {
    return admin
      .from('users')
      .select(fields)
      .eq('slug' satisfies keyof Database['public']['Tables']['users']['Row'], normalizedSlug)
      .maybeSingle<PublicPhotographer>()
  }

  async function lookupByStudioName(fields: string) {
    return admin
      .from('users')
      .select(fields)
      .eq('studio_name', normalizedSlug)
      .limit(1)
      .returns<PublicPhotographer[]>()
  }

  let fields = PHOTOGRAPHER_PUBLIC_FIELDS
  let legacyFields = false
  let { data: bySlug, error: slugError } = await lookupBySlug(fields)

  if (slugError && isMissingColumnError(slugError) && !legacyFields) {
    legacyFields = true
    fields = stripPortfolioLayoutFields(fields)
    ;({ data: bySlug, error: slugError } = await lookupBySlug(fields))
  }

  if (slugError) {
    if (slugError.code !== 'PGRST116') {
      console.error('[findPhotographerBySlug] slug lookup error:', formatDbError(slugError))
      if (isDbPermissionError(slugError.code)) {
        throw new Error(
          'Missing database permissions. Set SUPABASE_SERVICE_ROLE_KEY in .env.local'
        )
      }
      if (isMissingColumnError(slugError)) {
        throw new Error(
          `Database schema is out of date. ${getMissingColumnMigrationHint(slugError)}`
        )
      }
    }
  } else if (bySlug) {
    return withDefaultGalleryLayoutMode(bySlug)
  }

  let { data: byStudioName, error: studioError } = await lookupByStudioName(fields)

  if (studioError && isMissingColumnError(studioError) && !legacyFields) {
    legacyFields = true
    fields = stripPortfolioLayoutFields(fields)
    ;({ data: byStudioName, error: studioError } = await lookupByStudioName(fields))
  }

  if (studioError) {
    console.error('[findPhotographerBySlug] studio_name lookup error:', formatDbError(studioError))
    if (isDbPermissionError(studioError.code)) {
      throw new Error(
        'Missing database permissions. Set SUPABASE_SERVICE_ROLE_KEY in .env.local'
      )
    }
    if (isMissingColumnError(studioError)) {
      throw new Error(
        `Database schema is out of date. ${getMissingColumnMigrationHint(studioError)}`
      )
    }
    return null
  }

  const match = byStudioName?.[0]
  return match ? withDefaultGalleryLayoutMode(match) : null
}

export function getPublicSitePath(slug: string | null | undefined, studioName: string | null | undefined) {
  if (slug?.trim()) return `/${slug.trim()}`
  if (studioName?.trim()) return `/${encodeURIComponent(studioName.trim())}`
  return null
}
