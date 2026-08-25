import type { SiteLanguage } from '@/lib/site-language'
import styles from './ClassicTestimonialCard.module.css'

export type ClassicTestimonial = {
  id: string
  title: string
  content: string
  shootType: string | null
  reviewDate: string | null
  createdAt: string
  imageUrl: string | null
}

export type ClassicTestimonialCardProps = {
  testimonial: ClassicTestimonial
  accentColor: string
  /** Falls back to the studio logo when the testimonial itself has no photo —
   * mirrors testimonialThumbSrc() in generate-homepage-html.ts. */
  logoUrl?: string | null
  language: SiteLanguage
}

/** Formats the review date exactly like the old renderer's formatReviewDate():
 * always 'he-IL' regardless of site language. That's a quirk of the source,
 * not a bug we're fixing here — see MANDATORY CONVENTIONS. */
function formatReviewDate(testimonial: ClassicTestimonial): string {
  const raw = testimonial.reviewDate || testimonial.createdAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

export function ClassicTestimonialCard({ testimonial, accentColor, logoUrl, language }: ClassicTestimonialCardProps) {
  const thumbSrc = testimonial.imageUrl || logoUrl || null
  const meta = [testimonial.shootType, formatReviewDate(testimonial)].filter(Boolean).join(' · ')
  const dir = language === 'en' ? 'ltr' : 'rtl'

  return (
    <div className={styles.card}>
      {/* Material Symbols "format_quote" glyph — 1:1 with the old renderer's
          icon (see the .quote rule in ClassicTestimonialCard.module.css for
          why this now renders as the real icon instead of a plain "
          character standing in for it). */}
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
        {meta ? (
          <div className={styles.footer} style={{ color: accentColor }}>
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  )
}
