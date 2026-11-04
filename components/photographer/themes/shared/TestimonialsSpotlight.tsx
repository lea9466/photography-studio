'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  /** Falls back to the studio logo (as a small avatar) when a testimonial has no photo of its own. */
  logoUrl?: string | null
  language: SiteLanguage
  /** Which theme it sits in — the card frame, corners and shadow follow that theme's own cards. */
  variant: SpotlightVariant
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

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The `testimonial_layout_type === 'spotlight'` studio setting: one large
 * quote card at a time, crossfading to the next every few seconds, with
 * prev/next arrows, dots and a "02 / 05" counter when there's more than one.
 *
 * A testimonial with its own photo gets a split card — the photo in an offset
 * frame on one side, the quote on the other; without one the quote is
 * centered (with the studio logo as a small avatar, if there is one). The
 * card's frame/corners/shadow follow the theme (`variant`), like each
 * theme's own testimonial cards. Long quotes stop at QUOTE_LINES lines with
 * the shared "read more" dialog, so one long review can't blow the card up.
 *
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
      className={`${styles.wrap} ${styles[variant]}`}
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
          const photo = testimonial.imageUrl
          const avatar = photo ? null : logoUrl || null
          const meta = [testimonial.shootType, formatReviewDate(testimonial)].filter(Boolean).join(' · ')
          return (
            <figure
              key={testimonial.id}
              className={`${styles.slide} ${isActive ? styles.active : ''}`}
              aria-hidden={!isActive}
              inert={!isActive}
            >
              <div className={`${styles.card} ${photo ? styles.withPhoto : ''}`}>
                {photo ? (
                  <div className={styles.photo}>
                    <span aria-hidden="true" className={styles.photoFrame} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.photoImage} src={photo} alt="" loading="lazy" />
                  </div>
                ) : null}

                <div className={styles.body}>
                  <span aria-hidden="true" className={styles.quote}>
                    &rdquo;
                  </span>
                  <div className={styles.stars} aria-hidden="true">
                    ★★★★★
                  </div>
                  <blockquote className={styles.textWrap}>
                    <TestimonialText
                      text={testimonial.content}
                      className={styles.text}
                      title={testimonial.title}
                      meta={meta}
                      thumbSrc={photo || avatar}
                      accentColor={accentColor}
                      language={language}
                      lines={QUOTE_LINES}
                    />
                  </blockquote>
                  <span aria-hidden="true" className={styles.rule} />
                  <figcaption className={styles.caption}>
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={styles.avatar} src={avatar} alt="" loading="lazy" />
                    ) : null}
                    <span>
                      {testimonial.title ? <span className={styles.name}>{testimonial.title}</span> : null}
                      {meta ? <span className={styles.meta}>{meta}</span> : null}
                    </span>
                  </figcaption>
                </div>
              </div>
            </figure>
          )
        })}
      </div>

      {count > 1 ? (
        <div className={styles.nav}>
          <button type="button" className={styles.arrow} aria-label={copy.prev} onClick={() => goTo(active - 1)}>
            {isEn ? <ChevronLeft aria-hidden="true" size={18} /> : <ChevronRight aria-hidden="true" size={18} />}
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
          <button type="button" className={styles.arrow} aria-label={copy.next} onClick={() => goTo(active + 1)}>
            {isEn ? <ChevronRight aria-hidden="true" size={18} /> : <ChevronLeft aria-hidden="true" size={18} />}
          </button>
          <span className={styles.counter} aria-hidden="true" dir="ltr">
            {pad(active + 1)} / {pad(count)}
          </span>
        </div>
      ) : null}
    </div>
  )
}
