'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { TestimonialsMarquee } from '../shared/TestimonialsMarquee'
import { TestimonialsCarousel } from '../shared/TestimonialsCarousel'
import { TestimonialsFlipGrid } from '../shared/TestimonialsFlipGrid'
import { ElegantSectionHeading } from './ElegantSectionHeading'
import { ElegantTestimonialCard, type ElegantTestimonial } from './ElegantTestimonialCard'
import styles from './ElegantTestimonialsSection.module.css'

export type ElegantTestimonialsSectionProps = {
  title: string
  testimonials: ElegantTestimonial[]
  accentColor: string
  logoUrl?: string | null
  language: SiteLanguage
  /** Mirrors `photographer.testimonial_layout_type` — see ClassicTestimonialsSection. */
  layoutType?: 'carousel' | 'marquee' | 'flip-cards'
}

/**
 * Elegant theme's "Recommend" testimonials section — 1:1 port of the
 * `id="testimonials"` block in lib/homepage-themes/elegant.ts (line ~1219)
 * together with generateTestimonialsSection() (lib/homepage-themes/generate-homepage-html.ts
 * ~1600), including both non-default layouts — see ClassicTestimonialsSection's
 * docblock for the shared/TestimonialsMarquee and shared/TestimonialsCarousel
 * details. Header is LTR/flush-left via `elegantFaqSectionCss()`'s shared
 * `.testimonials-section__header` rule (same function that styles the FAQ
 * header — both resolve to the same left-docked layout), matching
 * ElegantSectionHeading's `align="start"`.
 *
 * The per-card entrance stagger (`index * 150ms` transition-delay) only
 * applies in the plain-grid/carousel cases — matches the source's
 * `forMarquee` branch, which strips it for the marquee (passing `index={0}`
 * reuses ElegantTestimonialCard's existing "no delay before the 2nd card"
 * rule instead of adding a separate prop).
 */
export function ElegantTestimonialsSection({
  title,
  testimonials,
  accentColor,
  logoUrl,
  language,
  layoutType,
}: ElegantTestimonialsSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const { ref: headerRef, revealed: headerRevealed } = useRevealOnScroll<HTMLDivElement>()

  // Matches the old renderer: hasTestimonials = testimonials.length > 0.
  if (testimonials.length === 0) return null

  const isMarquee = layoutType === 'marquee'
  const cards = testimonials.map((testimonial, index) => (
    <ElegantTestimonialCard
      key={testimonial.id}
      testimonial={testimonial}
      accentColor={accentColor}
      logoUrl={logoUrl}
      index={isMarquee ? 0 : index}
    />
  ))

  return (
    <section
      ref={ref}
      id="testimonials"
      className={`${styles.section} reveal-on-scroll ${revealed ? 'active' : ''}`}
    >
      <div ref={headerRef} className={`${styles.header} stagger-reveal ${headerRevealed ? 'is-visible' : ''}`}>
        <ElegantSectionHeading title={title} watermark="RECOMMEND" accentColor={accentColor} align="start" />
      </div>

      {layoutType === 'flip-cards' ? (
        <TestimonialsFlipGrid
          testimonials={testimonials}
          accentColor={accentColor}
          logoUrl={logoUrl}
          language={language}
        />
      ) : isMarquee ? (
        <TestimonialsMarquee items={cards} />
      ) : testimonials.length > 3 ? (
        <TestimonialsCarousel items={cards} language={language} />
      ) : (
        <div className={styles.grid}>{cards}</div>
      )}
    </section>
  )
}
