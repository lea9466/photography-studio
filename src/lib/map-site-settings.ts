import type { SiteSettingsRow } from '@/lib/database.types'
import { coerceStat } from '@/lib/numbers'
import { parseThemeStyle } from '@/lib/theme-styles'

function pickString(row: Record<string, unknown>, key: string): string | null {
  const v = row[key]
  if (typeof v === 'string') {
    const t = v.trim()
    return t || null
  }
  return null
}

function pickStat(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    if (key in row && row[key] != null) {
      return coerceStat(row[key])
    }
  }
  return null
}

/** ממפה שורה מ-`select('*')` לטיפוס האפליקציה. */
export function mapSiteSettingsRow(raw: Record<string, unknown>): SiteSettingsRow {
  return {
    id: String(raw.id ?? ''),
    photographer_id: String(raw.photographer_id ?? ''),
    business_name: pickString(raw, 'business_name'),
    tagline: pickString(raw, 'tagline'),
    about_text: pickString(raw, 'about_text'),
    about_headline_line1: pickString(raw, 'about_headline_line1'),
    about_headline_line2: pickString(raw, 'about_headline_line2'),
    about_quote: pickString(raw, 'about_quote'),
    phone: pickString(raw, 'phone'),
    email: pickString(raw, 'email'),
    whatsapp: pickString(raw, 'whatsapp'),
    years_experience: pickStat(raw, 'years_experience'),
    total_clients: pickStat(raw, 'total_clients'),
    total_projects: pickStat(raw, 'total_projects'),
    primary_color: pickString(raw, 'primary_color'),
    secondary_color: pickString(raw, 'secondary_color'),
    hero_image_url: pickString(raw, 'hero_image_url'),
    hero_image_url_mobile: pickString(raw, 'hero_image_url_mobile'),
    about_image_url: pickString(raw, 'about_image_url'),
    logo_url: pickString(raw, 'logo_url'),
    theme_style: parseThemeStyle(pickString(raw, 'theme_style')),
  }
}
