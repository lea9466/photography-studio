export const TESTIMONIALS_SECTION_DEFAULTS: Record<string, string> = {
  elegant: 'מה לקוחות אומרות',
  modern: 'מה הלקוחות אומרים',
  classic: 'לקוחות מספרים',
  dark: 'מה הלקוחות שלנו אומרים',
}

export function resolveTestimonialsSectionTitle(
  theme: string,
  testimonialsTitle?: string | null
) {
  const fallback =
    TESTIMONIALS_SECTION_DEFAULTS[theme] ?? TESTIMONIALS_SECTION_DEFAULTS.elegant

  return testimonialsTitle?.trim() || fallback
}
