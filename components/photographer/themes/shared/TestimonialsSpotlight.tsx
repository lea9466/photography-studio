'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import type { SiteLanguage } from '@/lib/site-language'
import { TestimonialText } from './TestimonialText'
import styles from './TestimonialsSpotlight.module.css'

/** Same shape every theme's own `*Testimonial` card uses — the section
 * passes its `testimonials` array straight through, like TestimonialsFlipGrid. */
export type SpotlightTestimonial = {
  id: string
  title: string
  content: string
  shootType: string | null
  reviewDate: string | null
  createdAt: string
  imageUrl: string | null
}

export type SpotlightVariant = 'classic' | 'elegant' | 'modern' | 'dark'

export type TestimonialsSpotlightProps = {
  testimonials: SpotlightTestimonial[]
  accentColor: string
  /** Falls back to the studio logo for the avatar when a testimonial has no photo of its own. */
  logoUrl?: string | null
  language: SiteLanguage
  /** Which theme it sits in — the dark theme gets the dark card; the others share the light one. */
  variant: SpotlightVariant
}

/**
 * Props for the theme's own <section> when the spotlight layout is on: the
 * whole section gets a soft vertical gradient built from the studio's accent
 * (the card itself stays a clean solid on top of it — the gradient behind it
 * is what makes the layout feel finished).
 */
export function spotlightSectionProps(accentColor: string, variant: SpotlightVariant) {
  return {
    className: `${styles.section} ${variant === 'dark' ? styles.sectionDark : ''}`,
    style: { '--spot-accent': accentColor } as React.CSSProperties,
  }
}

const AUTO_ADVANCE_MS = 6000
/** Lines of quote shown before "read more". */
const QUOTE_LINES = 4

const COPY = {
  he: { prev: 'התגובה הקודמת', next: 'התגובה הבאה', dot: 'תגובה' },
  en: { prev: 'Previous testimonial', next: 'Next testimonial', dot: 'Testimonial' },
} as const

/** he-IL regardless of site language — same quirk every theme's TestimonialCard keeps. */
function formatReviewDate(testimonial: SpotlightTestimonial): string {
  const raw = testimonial.reviewDate || testimonial.createdAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

/** First letter of the first two words — "מירי כהן" → "מכ". */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The `testimonial_layout_type === 'spotlight'` studio setting: one large,
 * soft, rounded quote card at a time — quote icon, the testimonial in
 * medium-weight type framed by accent quote marks, then a divider and the
 * client's avatar (her photo, the studio logo, or her initials), name and
 * shoot type — crossfading to the next every few seconds, with round prev/next
 * arrows and dots when there's more than one.
 *
 * Long quotes stop at QUOTE_LINES lines with the shared "read more" dialog.
 * Every slide is stacked in the same grid cell, so the card always takes the
 * height of the tallest one and the page never jumps on a change. Inactive
 * slides are `inert`. Auto-advance pauses on hover/focus and is off entirely
 * for visitors who asked for reduced motion.
 */
export function TestimonialsSpotlight({
  testimonials,
  accentColor,
  logoUrl,
  language,
  variant,
}: TestimonialsSpotlightProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const count = testimonials.length

  useEffect(() => {
    if (count <= 1 || paused || prefersReducedMotion()) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [count, paused, resetSignal])

  if (count === 0) return null

  const active = Math.min(index, count - 1)
  const isEn = language === 'en'
  const copy = isEn ? COPY.en : COPY.he

  function goTo(i: number) {
    setIndex((i + count) % count)
    setResetSignal((s) => s + 1)
  }

  return (
    <div
      className={`${styles.wrap} ${variant === 'dark' ? styles.dark : ''}`}
      style={{ '--spot-accent': accentColor } as React.CSSProperties}
      dir={isEn ? 'ltr' : 'rtl'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.stage} aria-live="polite">
        {testimonials.map((testimonial, i) => {
          const isActive = i === active
          const avatarSrc = testimonial.imageUrl || logoUrl || null
          const meta = [testimonial.shootType, formatReviewDate(testimonial)].filter(Boolean).join(' · ')
          return (
            <figure
              key={testimonial.id}
              className={`${styles.slide} ${isActive ? styles.active : ''}`}
              aria-hidden={!isActive}
              inert={!isActive}
            >
              <div className={styles.card}>
                <Quote aria-hidden="true" className={styles.quoteIcon} strokeWidth={1.5} />

                <blockquote className={styles.quote}>
                  <TestimonialText
                    text={testimonial.content}
                    className={styles.text}
                    title={testimonial.title}
                    meta={meta}
                    thumbSrc={avatarSrc}
                    accentColor={accentColor}
                    language={language}
                    lines={QUOTE_LINES}
                  />
                </blockquote>

                <figcaption className={styles.footer}>
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.avatar} src={avatarSrc} alt="" loading="lazy" />
                  ) : (
                    <span aria-hidden="true" className={styles.avatar}>
                      {initials(testimonial.title)}
                    </span>
                  )}
                  <span className={styles.meta}>
                    {testimonial.title ? <span className={styles.name}>{testimonial.title}</span> : null}
                    {meta ? <span className={styles.subtitle}>{meta}</span> : null}
                  </span>
                </figcaption>
              </div>
            </figure>
          )
        })}
      </div>

      {count > 1 ? (
        <div className={styles.controls}>
          <button type="button" className={styles.nav} aria-label={copy.prev} onClick={() => goTo(active - 1)}>
            {isEn ? <ChevronLeft aria-hidden="true" size={20} /> : <ChevronRight aria-hidden="true" size={20} />}
          </button>
          <div className={styles.dots}>
            {testimonials.map((testimonial, i) => (
              <button
                key={testimonial.id}
                type="button"
                className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
                aria-label={`${copy.dot} ${i + 1}`}
                aria-current={i === active}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button type="button" className={styles.nav} aria-label={copy.next} onClick={() => goTo(active + 1)}>
            {isEn ? <ChevronRight aria-hidden="true" size={20} /> : <ChevronLeft aria-hidden="true" size={20} />}
          </button>
        </div>
      ) : null}
    </div>
  )
}
