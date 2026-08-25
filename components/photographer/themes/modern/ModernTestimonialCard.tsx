import type { SiteLanguage } from '@/lib/site-language'
import styles from './ModernTestimonialCard.module.css'

/** Mirrors ClassicTestimonialCard's `ClassicTestimonial` shape — same fields
 * off lib/homepage-themes/types.ts's `Testimonial`, camelCased. */
export type ModernTestimonial = {
  id: string
  title: string
  content: string
  shootType: string | null
  reviewDate: string | null
  createdAt: string
  imageUrl: string | null
}

export type ModernTestimonialCardProps = {
  testimonial: ModernTestimonial
  accentColor: string
  /** Falls back to the studio logo when the testimonial itself has no photo —
   * mirrors testimonialThumbSrc() in generate-homepage-html.ts. */
  logoUrl?: string | null
  language: SiteLanguage
  /** Modern-only entrance stagger, mirrors generateThemeTestimonialCard's
   * modern branch (`delay-100`/`delay-200`/`delay-300`, capped at index*100,
   * lib/homepage-themes/generate-homepage-html.ts). Applied via the shared
   * `.stagger-reveal`/`delay-*` classes from modern-theme.css. */
  index?: number
}

/** Formats the review date exactly like the old renderer's formatReviewDate():
 * always 'he-IL' regardless of site language — same quirk ClassicTestimonialCard
 * preserves, not a bug fixed here. */
function formatReviewDate(testimonial: ModernTestimonial): string {
  const raw = testimonial.reviewDate || testimonial.createdAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

export function ModernTestimonialCard({ testimonial, accentColor, logoUrl, language }: ModernTestimonialCardProps) {
  const thumbSrc = testimonial.imageUrl || logoUrl || null
  const meta = [testimonial.shootType, formatReviewDate(testimonial)].filter(Boolean).join(' · ')
  const dir = language === 'en' ? 'ltr' : 'rtl'

  return (
    <div className={styles.card} style={{ '--modern-accent': accentColor } as React.CSSProperties}>
      {/* Material Symbols "format_quote" glyph — 1:1 with the old renderer's
          icon (quoteHtml in generate-homepage-html.ts), not a plain "
          character standing in for it — see ClassicTestimonialCard.tsx's
          identical fix/note. */}
      <span aria-hidden="true" className={styles.quote} style={{ color: accentColor }}>
        format_quote
      </span>

      {thumbSrc ? (
        <div className={styles.thumb}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className={styles.thumbImage} src={thumbSrc} loading="lazy" />
        </div>
      ) : null}

      <div className={styles.content} dir={dir}>
        {testimonial.title ? <h4 className={styles.title}>{testimonial.title}</h4> : null}
        <p className={styles.text}>{testimonial.content}</p>
        {meta ? <div className={styles.footer}>{meta}</div> : null}
      </div>
    </div>
  )
}
