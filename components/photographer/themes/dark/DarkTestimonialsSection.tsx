'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { TestimonialsMarquee } from '../shared/TestimonialsMarquee'
import { TestimonialsCarousel } from '../shared/TestimonialsCarousel'
import { DarkSectionEyebrow } from './DarkSectionEyebrow'
import { DarkTestimonialCard, type DarkTestimonial } from './DarkTestimonialCard'
import styles from './DarkTestimonialsSection.module.css'

export type DarkTestimonialsSectionProps = {
  title: string
  testimonials: DarkTestimonial[]
  accentColor: string
  logoUrl?: string | null
  language: SiteLanguage
  /** Mirrors `photographer.testimonial_layout_type` — see ClassicTestimonialsSection. */
  layoutType?: 'carousel' | 'marquee'
}

/**
 * Dark theme's "Recommend" testimonials section — 1:1 port of the
 * `id="testimonials"` block in lib/homepage-themes/dark.ts (line ~1459)
 * together with generateTestimonialsSection() in
 * lib/homepage-themes/generate-homepage-html.ts (~1600), including both
 * non-default layouts — see ClassicTestimonialsSection's docblock for the
 * shared/TestimonialsMarquee and shared/TestimonialsCarousel details.
 */
export function DarkTestimonialsSection({
  title,
  testimonials,
  accentColor,
  logoUrl,
  language,
  layoutType,
}: DarkTestimonialsSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  // Matches the old renderer: hasTestimonials = testimonials.length > 0.
  if (testimonials.length === 0) return null

  const cards = testimonials.map((testimonial) => (
    <DarkTestimonialCard
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
        <div className={styles.header}>
          <DarkSectionEyebrow accentColor={accentColor}>RECOMMEND</DarkSectionEyebrow>
          <h2 className={styles.title}>{title}</h2>
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
