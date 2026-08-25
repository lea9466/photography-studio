import styles from './ElegantTestimonialCard.module.css'

export type ElegantTestimonial = {
  id: string
  title: string
  content: string
  shootType: string | null
  reviewDate: string | null
  createdAt: string
  imageUrl: string | null
}

export type ElegantTestimonialCardProps = {
  testimonial: ElegantTestimonial
  accentColor: string
  /** Falls back to the studio logo when the testimonial itself has no photo —
   * mirrors testimonialThumbSrc() in generate-homepage-html.ts. */
  logoUrl?: string | null
  /** `index * 150`ms entrance stagger, applied only from the 2nd card on —
   * mirrors generateThemeTestimonialCard()'s elegant branch
   * (`index > 0 ? transition-delay: ${index * 150}ms : ''`). */
  index: number
}

/** Formats the review date exactly like the old renderer's formatReviewDate():
 * always 'he-IL' regardless of site language. That's a quirk of the source,
 * not a bug we're fixing here — see MANDATORY CONVENTIONS. */
function formatReviewDate(testimonial: ElegantTestimonial): string {
  const raw = testimonial.reviewDate || testimonial.createdAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

/**
 * Elegant theme's testimonial card — 1:1 port of generateTestimonialThumbCard's
 * `variant === 'elegant'` branch (lib/homepage-themes/generate-homepage-html.ts,
 * line ~1480): a 5-star row, italic quote text, then a footer with the
 * reviewer's name + shoot-type/date meta — visually distinct from classic's
 * title-first layout. The quote-mark glyph and thumb photo are the same
 * `.testimonial-thumb-card__*` shared markup every theme uses.
 */
export function ElegantTestimonialCard({ testimonial, accentColor, logoUrl, index }: ElegantTestimonialCardProps) {
  const thumbSrc = testimonial.imageUrl || logoUrl || null
  const meta = [testimonial.shootType, formatReviewDate(testimonial)].filter(Boolean).join(' · ')
  const style = index > 0 ? { transitionDelay: `${index * 150}ms` } : undefined

  return (
    <div className={styles.card} style={style}>
      <span aria-hidden="true" className={styles.quote} style={{ color: accentColor }}>
        &rdquo;
      </span>

      {thumbSrc ? (
        <div className={styles.thumb}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className={styles.thumbImage} src={thumbSrc} loading="lazy" />
        </div>
      ) : null}

      <div className={styles.content}>
        <div>
          <div className={styles.stars} style={{ color: accentColor }} aria-hidden="true">
            <span className="material-symbols-outlined">star</span>
            <span className="material-symbols-outlined">star</span>
            <span className="material-symbols-outlined">star</span>
            <span className="material-symbols-outlined">star</span>
            <span className="material-symbols-outlined">star</span>
          </div>
          <p className={styles.text}>{testimonial.content}</p>
        </div>
        <div className={styles.footer}>
          <h4 className={styles.title}>{testimonial.title}</h4>
          {meta ? <p className={styles.meta}>{meta}</p> : null}
        </div>
      </div>
    </div>
  )
}
