import { unstable_noStore as noStore } from 'next/cache'
import { fetchSiteSettings } from '@/lib/db'
import { coerceStat } from '@/lib/numbers'
import { parseThemeStyle, type ThemeStyle } from '@/lib/theme-styles'

export type SiteSettings = {
  business_name: string
  tagline: string
  about_text: string
  about_headline_line1: string
  about_headline_line2: string
  about_quote: string
  phone: string
  email: string
  whatsapp: string
  years_experience: number
  total_clients: number
  total_projects: number
  primary_color: string
  secondary_color: string
  hero_image_url: string
  hero_image_url_mobile: string
  about_image_url: string
  logo_url: string
  theme_style: ThemeStyle
}

export async function getSiteSettings(
  photographerSlug: string
): Promise<SiteSettings | null> {
  noStore()
  const row = await fetchSiteSettings(photographerSlug)
  if (!row) {
    console.warn(
      `site_settings: no row for slug "${photographerSlug}" — run supabase/seed.sql and supabase/photographers-slug.sql`
    )
    return null
  }

  return {
    business_name: row.business_name ?? '',
    tagline: row.tagline ?? '',
    about_text: row.about_text ?? '',
    about_headline_line1: row.about_headline_line1 ?? '',
    about_headline_line2: row.about_headline_line2 ?? '',
    about_quote: row.about_quote ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    whatsapp: row.whatsapp ?? '',
    years_experience: coerceStat(row.years_experience),
    total_clients: coerceStat(row.total_clients),
    total_projects: coerceStat(row.total_projects),
    primary_color: row.primary_color ?? '',
    secondary_color: row.secondary_color ?? '',
    hero_image_url: row.hero_image_url ?? '',
    hero_image_url_mobile: row.hero_image_url_mobile ?? '',
    about_image_url: row.about_image_url ?? '',
    logo_url: row.logo_url ?? '',
    theme_style: parseThemeStyle(row.theme_style),
  }
}
