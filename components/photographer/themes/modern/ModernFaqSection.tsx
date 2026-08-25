'use client'

import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { SectionTitle } from '../shared/SectionTitle'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { ModernFaqItem } from './ModernFaqItem'
import styles from './ModernFaqSection.module.css'

export type ModernFaqSectionProps = {
  /** Raw photographer.faq_items — parsed/sanitized the same way the old
   * renderer did (parseFaqItems + sanitizeFaqItems from lib/faq.ts). */
  faqItems: unknown
  accentColor: string
  language: SiteLanguage
}

/**
 * Modern-theme FAQ section — ports the `currentTheme === 'modern'` branch of
 * generateFaqSectionHTML (lib/homepage-themes/generate-homepage-html.ts,
 * ~line 1273-1293): a centered eyebrow+title header over a native
 * `<details>`/`<summary>` accordion split into two columns (even-index
 * items right/start column, odd-index items left/end column — mirrors
 * generateFaqAccordionHTML's rightColumnItems/leftColumnItems split,
 * ~line 1037-1039). Unlike classic/elegant, modern never uses the
 * "magazine" FAQ layout (no faqSectionImageUrl branch here) — see
 * ModernFaqItem.tsx's doc comment.
 */
export function ModernFaqSection({ faqItems, accentColor, language }: ModernFaqSectionProps) {
  const items = sanitizeFaqItems(parseFaqItems(faqItems))
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  // Matches the old renderer: generateFaqSectionHTML returns '' when there
  // are no valid FAQ items — the section doesn't exist at all.
  if (items.length === 0) return null

  const copy = getHomepageCopy(language)
  const rightColumnItems = items.filter((_, index) => index % 2 === 0)
  const leftColumnItems = items.filter((_, index) => index % 2 === 1)

  return (
    <section
      ref={ref}
      id="faq"
      className={`${styles.section} stagger-reveal ${revealed ? 'is-visible' : ''}`}
      style={{ '--modern-accent': accentColor } as React.CSSProperties}
    >
      {/* Ambient left/right radial-gradient glow blobs — 1:1 with
          faqAmbientGlowHtml in lib/homepage-themes/generate-homepage-html.ts
          (`.faq-section-glow--left`/`--right`), masked top/bottom so they
          fade into the plain page background instead of cutting off. */}
      <div aria-hidden="true" className={`${styles.glow} ${styles.glowLeft}`} />
      <div aria-hidden="true" className={`${styles.glow} ${styles.glowRight}`} />

      <div className={styles.inner}>
        <div className={styles.header}>
          <ModernSectionEyebrow align="center">FAQ</ModernSectionEyebrow>
          <SectionTitle color="#0f172a" style={{ textAlign: 'center' }}>
            {copy.sections.faq}
          </SectionTitle>
        </div>

        <div className={styles.accordion}>
          <div className={styles.column}>
            {rightColumnItems.map((item, index) => (
              <ModernFaqItem key={`right-${index}`} question={item.question} answer={item.answer} />
            ))}
          </div>
          <div className={styles.column}>
            {leftColumnItems.map((item, index) => (
              <ModernFaqItem key={`left-${index}`} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
