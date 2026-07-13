import type { SiteLanguage } from '@/lib/site-language'

export const TESTIMONIALS_SECTION_DEFAULTS: Record<string, string> = {
  elegant: 'מה לקוחות אומרות',
  modern: 'מה הלקוחות אומרים',
  classic: 'לקוחות מספרים',
  dark: 'מה הלקוחות שלנו אומרים',
}

export const TESTIMONIALS_SECTION_DEFAULTS_EN: Record<string, string> = {
  elegant: 'What Clients Say',
  modern: 'What Clients Say',
  classic: 'Client Stories',
  dark: 'What Our Clients Say',
}

export const TESTIMONIALS_SECTION_SUBTITLE_DEFAULTS: Record<string, string> = {
  classic: 'מה הלקוחות אומרים',
}

export const TESTIMONIALS_SECTION_SUBTITLE_DEFAULTS_EN: Record<string, string> = {
  classic: 'What Clients Say',
}

export function resolveTestimonialsSectionTitle(
  theme: string,
  testimonialsTitle?: string | null,
  language: SiteLanguage = 'he',
) {
  const defaults =
    language === 'en'
      ? TESTIMONIALS_SECTION_DEFAULTS_EN
      : TESTIMONIALS_SECTION_DEFAULTS
  const fallback = defaults[theme] ?? defaults.elegant

  return testimonialsTitle?.trim() || fallback
}

export function resolveTestimonialsSectionSubtitle(
  theme: string,
  language: SiteLanguage = 'he',
) {
  const defaults =
    language === 'en'
      ? TESTIMONIALS_SECTION_SUBTITLE_DEFAULTS_EN
      : TESTIMONIALS_SECTION_SUBTITLE_DEFAULTS
  return defaults[theme] ?? ''
}
