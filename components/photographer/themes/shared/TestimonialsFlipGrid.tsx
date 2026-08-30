'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './TestimonialsFlipGrid.module.css'

/** Structurally identical to every theme's own `*Testimonial` card shape
 * (id/title/content/shootType/reviewDate/createdAt/imageUrl) — the section
 * passes its `testimonials` array straight through. */
export type FlipTestimonial = {
  id: string
  title: string
  content: string
  shootType: string | null
  reviewDate: string | null
  createdAt: string
  imageUrl: string | null
}

export type TestimonialsFlipGridProps = {
  testimonials: FlipTestimonial[]
  accentColor: string
  /** Falls back to the studio logo when a testimonial has no photo of its
   * own — mirrors every theme's TestimonialCard `thumbSrc` rule. */
  logoUrl?: string | null
  language: SiteLanguage
}

/** he-IL regardless of site language — same quirk the per-theme
 * TestimonialCard components deliberately preserve (see ClassicTestimonialCard). */
function formatReviewDate(testimonial: FlipTestimonial): string {
  const raw = testimonial.reviewDate || testimonial.createdAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

/**
 * The `testimonial_layout_type === 'flip-cards'` studio setting: wide
 * rectangular cards laid out up to 3 per row on desktop (2 on tablet, 1 on
 * mobile), wrapping into extra rows past that — no slider/marquee, the page
 * just scrolls. Each card shows the testimonial text in bold dark type over
 * its photo shown light behind a soft white scrim; it flips to reveal the
 * photo in full colour on hover (pointer devices) and on click / tap / Enter
 * (the full-card toggle button, which also keeps it keyboard-operable).
 *
 * A testimonial with no photo of its own and no studio-logo fallback has
 * nothing to flip to, so it renders as a plain static front-face card.
 */
export function TestimonialsFlipGrid({
  testimonials,
  accentColor,
  logoUrl,
  language,
}: TestimonialsFlipGridProps) {
  const dir = language === 'en' ? 'ltr' : 'rtl'

  return (
    <div className={styles.grid} dir={dir}>
      {testimonials.map((testimonial) => (
        <FlipCard
          key={testimonial.id}
          testimonial={testimonial}
          accentColor={accentColor}
          logoUrl={logoUrl}
          language={language}
        />
      ))}
    </div>
  )
}

type FlipCardProps = {
  testimonial: FlipTestimonial
  accentColor: string
  logoUrl?: string | null
  language: SiteLanguage
}

function FlipCard({ testimonial, accentColor, logoUrl, language }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  const imageSrc = testimonial.imageUrl || logoUrl || null
  const meta = [testimonial.shootType, formatReviewDate(testimonial)].filter(Boolean).join(' · ')

  const accentStyle = { '--flip-accent': accentColor } as React.CSSProperties

  const content = (
    <div className={styles.content}>
      <span aria-hidden="true" className={styles.accentBar} />
      <span aria-hidden="true" className={styles.quote}>
        &rdquo;
      </span>
      {testimonial.title ? <h3 className={styles.title}>{testimonial.title}</h3> : null}
      <p className={styles.text}>{testimonial.content}</p>
      {meta ? <div className={styles.meta}>{meta}</div> : null}
    </div>
  )

  if (!imageSrc) {
    return (
      <article className={`${styles.card} ${styles.cardStatic}`} style={accentStyle}>
        <div className={`${styles.face} ${styles.front} ${styles.frontStatic}`}>{content}</div>
      </article>
    )
  }

  const flipLabel = language === 'en' ? 'Show photo' : 'הצג את התמונה'

  return (
    <article className={styles.card} style={accentStyle} data-flipped={flipped ? 'true' : undefined}>
      <button
        type="button"
        className={styles.flipToggle}
        aria-pressed={flipped}
        aria-label={flipLabel}
        onClick={() => setFlipped((current) => !current)}
      />
      <div className={styles.inner}>
        <div className={`${styles.face} ${styles.front}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.frontImage} src={imageSrc} alt="" aria-hidden="true" loading="lazy" />
          <div className={styles.frontScrim} />
          {content}
        </div>
        <div className={`${styles.face} ${styles.back}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.backImage} src={imageSrc} alt={testimonial.title || ''} loading="lazy" />
          {testimonial.title ? <div className={styles.backCaption}>{testimonial.title}</div> : null}
        </div>
      </div>
    </article>
  )
}
