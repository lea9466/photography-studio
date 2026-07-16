import type { SiteLanguage } from '@/lib/site-language'

export const GALLERIES_SECTION_DEFAULTS: Record<string, string> = {
  elegant: 'קולקציות נבחרות',
  modern: 'העבודות האחרונות שלנו',
  classic: 'עבודות נבחרות',
  dark: 'תיק עבודות נבחר',
}

export const GALLERIES_SECTION_DEFAULTS_EN: Record<string, string> = {
  elegant: 'Selected Collections',
  modern: 'Our Latest Work',
  classic: 'Selected Works',
  dark: 'Selected Portfolio',
}

export function resolveGalleriesSectionTitle(
  theme: string,
  galleriesTitle?: string | null,
  language: SiteLanguage = 'he',
) {
  const defaults =
    language === 'en' ? GALLERIES_SECTION_DEFAULTS_EN : GALLERIES_SECTION_DEFAULTS
  const fallback = defaults[theme] ?? defaults.elegant

  return galleriesTitle?.trim() || fallback
}

/** On the portfolio page, show a custom title only when the user entered one. */
export function resolvePortfolioGalleriesSectionTitle(
  galleriesTitle?: string | null,
): string | null {
  const trimmed = galleriesTitle?.trim()
  return trimmed || null
}
