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
  | 'hero_desktop_url'
  | 'hero_mobile_url'
  | 'hero_desktop_urls'
  | 'hero_mobile_urls'
  | 'about_image_url'
  | 'contact_desktop_url'
  | 'contact_mobile_url'
  | 'packages_desktop_url'
  | 'packages_mobile_url'
  | 'email'
  | 'faq_items'
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
  hero_desktop_url,
  hero_mobile_url,
  hero_desktop_urls,
  hero_mobile_urls,
  about_image_url,
  contact_desktop_url,
  contact_mobile_url,
  packages_desktop_url,
  packages_mobile_url,
  email,
  faq_items
`

const RESERVED_SLUGS = new Set(['favicon.ico', 'robots.txt', 'sitemap.xml'])

function isDbPermissionError(code?: string) {
  return code === '42501' || code === 'PGRST301'
}

function formatDbError(error: { message?: string; details?: string; hint?: string; code?: string }) {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  }
}

function isMissingColumnError(error: { message?: string; code?: string }) {
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const message = error.message?.toLowerCase() ?? ''
  return (
    message.includes('contact_desktop_url') ||
    message.includes('contact_mobile_url') ||
    message.includes('packages_desktop_url') ||
    message.includes('packages_mobile_url')
  )
}

export async function findPhotographerBySlug(decodedSlug: string): Promise<PublicPhotographer | null> {
  const normalizedSlug = decodedSlug.trim()
  if (!normalizedSlug || RESERVED_SLUGS.has(normalizedSlug)) {
    return null
  }

  const admin = createAdminClient()

  const { data: bySlug, error: slugError } = await admin
    .from('users')
    .select(PHOTOGRAPHER_PUBLIC_FIELDS)
    .eq('slug' satisfies keyof Database['public']['Tables']['users']['Row'], normalizedSlug)
    .maybeSingle<PublicPhotographer>()

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
          'Database schema is out of date. Run migration add_contact_background_images on Supabase.'
        )
      }
    }
  } else if (bySlug) {
    return bySlug
  }

  const { data: byStudioName, error: studioError } = await admin
    .from('users')
    .select(PHOTOGRAPHER_PUBLIC_FIELDS)
    .eq('studio_name', normalizedSlug)
    .limit(1)
    .returns<PublicPhotographer[]>()

  if (studioError) {
    console.error('[findPhotographerBySlug] studio_name lookup error:', formatDbError(studioError))
    if (isDbPermissionError(studioError.code)) {
      throw new Error(
        'Missing database permissions. Set SUPABASE_SERVICE_ROLE_KEY in .env.local'
      )
    }
    if (isMissingColumnError(studioError)) {
      throw new Error(
        'Database schema is out of date. Run migration add_contact_background_images on Supabase.'
      )
    }
    return null
  }

  return byStudioName?.[0] ?? null
}

export function getPublicSitePath(slug: string | null | undefined, studioName: string | null | undefined) {
  if (slug?.trim()) return `/${slug.trim()}`
  if (studioName?.trim()) return `/${encodeURIComponent(studioName.trim())}`
  return null
}
