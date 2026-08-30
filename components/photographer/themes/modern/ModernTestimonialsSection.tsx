'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { SectionTitle } from '../shared/SectionTitle'
import { TestimonialsMarquee } from '../shared/TestimonialsMarquee'
import { TestimonialsCarousel } from '../shared/TestimonialsCarousel'
import { TestimonialsFlipGrid } from '../shared/TestimonialsFlipGrid'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { ModernTestimonialCard, type ModernTestimonial } from './ModernTestimonialCard'
import styles from './ModernTestimonialsSection.module.css'

export type ModernTestimonialsSectionProps = {
  title: string
  testimonials: ModernTestimonial[]
  accentColor: string
  logoUrl?: string | null
  language: SiteLanguage
  /** Mirrors `photographer.testimonial_layout_type` — see ClassicTestimonialsSection. */
  layoutType?: 'carousel' | 'marquee' | 'flip-cards'
}

/**
 * Modern theme's testimonials section — ports the `id="testimonials"` block
 * in lib/homepage-themes/modern.ts (~line 1108-1122) together with
 * generateTestimonialsSection('modern') (lib/homepage-themes/generate-homepage-html.ts
 * ~1600), including both non-default layouts — see ClassicTestimonialsSection's
 * docblock for the shared/TestimonialsMarquee and shared/TestimonialsCarousel
 * details.
 *
 * The per-card entrance stagger (`delay-100/200/300`) only applies in the
 * plain-grid/carousel cases — matches the source's `forMarquee` branch,
 * which strips it for the marquee (omitting `index` reuses
 * ModernTestimonialCard's existing "no delay class" default instead of
 * adding a separate prop).
 */
export function ModernTestimonialsSection({
  title,
  testimonials,
  accentColor,
  logoUrl,
  language,
  layoutType,
}: ModernTestimonialsSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const { ref: headerRef, revealed: headerRevealed } = useRevealOnScroll<HTMLDivElement>()

  // Matches the old renderer: hasTestimonials = testimonials.length > 0.
  if (testimonials.length === 0) return null

  const isMarquee = layoutType === 'marquee'
  const cards = testimonials.map((testimonial, index) => (
    <ModernTestimonialCard
      key={testimonial.id}
      testimonial={testimonial}
      accentColor={accentColor}
      logoUrl={logoUrl}
      language={language}
      index={isMarquee ? undefined : index}
    />
  ))

  return (
    <section
      ref={ref}
      id="testimonials"
      className={`${styles.section} stagger-reveal ${revealed ? 'is-visible' : ''}`}
    >
      <div className={styles.inner}>
        <div
          ref={headerRef}
          className={`${styles.header} stagger-reveal ${headerRevealed ? 'is-visible' : ''}`}
          style={{ '--modern-accent': accentColor } as React.CSSProperties}
        >
          <ModernSectionEyebrow align="center">RECOMMEND</ModernSectionEyebrow>
          <SectionTitle color="#0f172a" style={{ textAlign: 'center' }}>
            {title}
          </SectionTitle>
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
      </div>
    </section>
  )
}
