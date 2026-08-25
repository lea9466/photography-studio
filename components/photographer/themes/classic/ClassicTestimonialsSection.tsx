'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { TestimonialsMarquee } from '../shared/TestimonialsMarquee'
import { TestimonialsCarousel } from '../shared/TestimonialsCarousel'
import { ClassicSectionScript } from './ClassicSectionScript'
import { ClassicTestimonialCard, type ClassicTestimonial } from './ClassicTestimonialCard'
import { SectionTitle } from '../shared/SectionTitle'
import styles from './ClassicTestimonialsSection.module.css'

export type ClassicTestimonialsSectionProps = {
  title: string
  testimonials: ClassicTestimonial[]
  accentColor: string
  logoUrl?: string | null
  language: SiteLanguage
  /** Mirrors `photographer.testimonial_layout_type` — 'marquee' scrolls
   * every testimonial in an infinite belt regardless of count; otherwise
   * (the default) more than 3 testimonials get the sliding carousel and
   * 3-or-fewer get the plain static row. */
  layoutType?: 'carousel' | 'marquee'
}

/**
 * Classic theme's "Recommend" testimonials section — ports the id="testimonials"
 * block in lib/homepage-themes/classic.ts (line ~1268) together with
 * generateTestimonialsSection() in lib/homepage-themes/generate-homepage-html.ts
 * (~line 1600), including both non-default layouts:
 *  - testimonial_layout_type === 'marquee': shared/TestimonialsMarquee, an
 *    auto-scrolling infinite belt (ported from TESTIMONIALS_MARQUEE_INIT_SCRIPT).
 *  - The default layout's >3-testimonials case: shared/TestimonialsCarousel,
 *    a sliding 3-per-slide carousel with dot pagination (ported from
 *    TESTIMONIALS_CAROUSEL_INIT_SCRIPT).
 * 3-or-fewer testimonials under the default layout keep the original static
 * flex-wrap grid below.
 */
export function ClassicTestimonialsSection({
  title,
  testimonials,
  accentColor,
  logoUrl,
  language,
  layoutType,
}: ClassicTestimonialsSectionProps) {
  // Matches the old renderer: hasTestimonials = testimonials.length > 0.
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const { ref: headerRef, revealed: headerRevealed } = useRevealOnScroll<HTMLDivElement>()

  if (testimonials.length === 0) return null

  const cards = testimonials.map((testimonial) => (
    <ClassicTestimonialCard
      key={testimonial.id}
      testimonial={testimonial}
      accentColor={accentColor}
      logoUrl={logoUrl}
      language={language}
    />
  ))

  return (
    <section
      ref={ref}
      id="testimonials"
      className={`reveal ${revealed ? 'active' : ''} ${styles.section} py-20`}
    >
      <div className={styles.inner}>
        <div ref={headerRef} className={`${styles.header} ${headerRevealed ? styles.isVisible : ''}`}>
          <ClassicSectionScript color={accentColor}>Recommend</ClassicSectionScript>
          <SectionTitle color="#2d2825">{title}</SectionTitle>
          <div className={styles.divider} />
        </div>

        {layoutType === 'marquee' ? (
          <TestimonialsMarquee items={cards} />
        ) : testimonials.length > 3 ? (
          <TestimonialsCarousel items={cards} language={language} />
        ) : (
          <div className={styles.grid}>{cards}</div>
        )}
      </div>
    </section>
  )
}
