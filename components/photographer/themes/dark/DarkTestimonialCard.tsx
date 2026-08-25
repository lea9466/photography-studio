import type { SiteLanguage } from '@/lib/site-language'
import styles from './DarkTestimonialCard.module.css'

export type DarkTestimonial = {
  id: string
  title: string
  content: string
  shootType: string | null
  reviewDate: string | null
  createdAt: string
  imageUrl: string | null
}

export type DarkTestimonialCardProps = {
  testimonial: DarkTestimonial
  accentColor: string
  /** Falls back to the studio logo when the testimonial itself has no photo —
   * mirrors testimonialThumbSrc() in generate-homepage-html.ts. */
  logoUrl?: string | null
  language: SiteLanguage
}

/** Formats the review date exactly like the old renderer's formatReviewDate():
 * always 'he-IL' regardless of site language — same quirk ported in
 * ClassicTestimonialCard, not fixed here either. */
function formatReviewDate(testimonial: DarkTestimonial): string {
  const raw = testimonial.reviewDate || testimonial.createdAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

export function DarkTestimonialCard({ testimonial, accentColor, logoUrl, language }: DarkTestimonialCardProps) {
  const thumbSrc = testimonial.imageUrl || logoUrl || null
  const meta = [testimonial.shootType, formatReviewDate(testimonial)].filter(Boolean).join(' · ')
  const dir = language === 'en' ? 'ltr' : 'rtl'

  return (
    <div className={styles.card}>
      {/* Source (generateTestimonialThumbCard in lib/homepage-themes/generate-homepage-html.ts,
          ~line 1441) renders the quote mark as the Material Symbols
          "format_quote" icon glyph — not a Unicode typographic quote
          character — same icon-font pattern already used by
          DarkPackageCard's feature checkmarks. */}
      <span
        aria-hidden="true"
        className={`material-symbols-outlined ${styles.quote}`}
        style={{ color: accentColor }}
      >
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
