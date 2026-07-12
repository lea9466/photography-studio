export const TESTIMONIALS_SECTION_DEFAULTS: Record<string, string> = {
  elegant: 'מה לקוחות אומרות',
  modern: 'מה הלקוחות אומרים',
  classic: 'לקוחות מספרים',
  dark: 'מה הלקוחות שלנו אומרים',
}

export const TESTIMONIALS_SECTION_SUBTITLE_DEFAULTS: Record<string, string> = {
  classic: 'מה הלקוחות אומרים',
}

export function resolveTestimonialsSectionTitle(
  theme: string,
  testimonialsTitle?: string | null
) {
  const fallback =
    TESTIMONIALS_SECTION_DEFAULTS[theme] ?? TESTIMONIALS_SECTION_DEFAULTS.elegant

  return testimonialsTitle?.trim() || fallback
}

export function resolveTestimonialsSectionSubtitle(theme: string) {
  return TESTIMONIALS_SECTION_SUBTITLE_DEFAULTS[theme] ?? ''
}
