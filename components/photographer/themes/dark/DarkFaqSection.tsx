'use client'

import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { getHomepageCopy } from '@/lib/homepage-copy'
import { hexToRgb } from '@/lib/homepage-themes/text-helpers'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { DarkSectionEyebrow } from './DarkSectionEyebrow'
import { DarkFaqAccordionItem } from './DarkFaqAccordionItem'
import styles from './DarkFaqSection.module.css'

export type DarkFaqSectionProps = {
  /** Raw photographer.faq_items — parsed/sanitized the same way the old
   * renderer did (parseFaqItems + sanitizeFaqItems from lib/faq.ts), same as
   * ClassicFaqSection. */
  faqItems: unknown
  accentColor: string
  language: SiteLanguage
}

/**
 * Dark theme's FAQ section — base layout ported from the
 * `currentTheme === 'dark'` branch of generateFaqSectionHTML()
 * (lib/homepage-themes/generate-homepage-html.ts, ~line 1297), which reuses
 * the same `faq-accordion--modern` two-column disclosure layout as modern's
 * FAQ (generateFaqAccordionHTML's `'modern' || 'dark'` branch) — NOT
 * classic's magazine-grid layout.
 *
 * The header is left-aligned (`DarkSectionEyebrow`'s default `align="left"`),
 * a DELIBERATE deviation from source, which centers this section's header
 * (`boldSectionEyebrow('FAQ', { align: 'center' })`) — Lea asked for FAQ's
 * title to match every other Dark section's left-docked header instead of
 * standing out as the one centered one (2026-08-24). The `.inner` container
 * also dropped source's own `max-w-7xl mx-auto` cap+center (still present in
 * the real source at generate-homepage-html.ts ~line 1303) so it spans the
 * full section width like Testimonials' own uncapped container — otherwise
 * the two titles only lined up below a 1280px viewport, since FAQ's boxed,
 * centered container and Testimonials' full-width one diverge on any wider
 * screen even when both titles are correctly left-docked within their own
 * boxes.
 *
 * Column split matches the source exactly: even-index items go in the
 * "start" column, odd-index items in the "end" column (`validFaqItems.filter
 * ((_, i) => i % 2 === 0)` / `=== 1`).
 */
export function DarkFaqSection({ faqItems, accentColor, language }: DarkFaqSectionProps) {
  const items = sanitizeFaqItems(parseFaqItems(faqItems))
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  // Matches the old renderer: generateFaqSectionHTML returns '' when there
  // are no valid FAQ items — the section doesn't exist at all. The reveal
  // hook above is still called unconditionally (rules of hooks).
  if (items.length === 0) return null

  const copy = getHomepageCopy(language)
  const accentRgb = hexToRgb(accentColor)
  const startColumn = items.filter((_, index) => index % 2 === 0)
  const endColumn = items.filter((_, index) => index % 2 === 1)

  return (
    <section
      ref={ref}
      id="faq"
      className={`reveal ${revealed ? 'active' : ''} ${styles.section} relative w-full`}
    >
      <div
        aria-hidden="true"
        className={`${styles.glow} ${styles.glowLeft}`}
        style={{
          background: `radial-gradient(circle, rgba(${accentRgb}, 0.3) 0%, rgba(${accentRgb}, 0.16) 36%, rgba(${accentRgb}, 0.06) 62%, transparent 84%)`,
        }}
      />
      <div
        aria-hidden="true"
        className={`${styles.glow} ${styles.glowRight}`}
        style={{
          background: `radial-gradient(circle, rgba(${accentRgb}, 0.18) 0%, rgba(${accentRgb}, 0.08) 38%, rgba(${accentRgb}, 0.03) 64%, transparent 86%)`,
        }}
      />

      <div className={`${styles.inner} relative z-10`}>
        <div className={styles.header}>
          <DarkSectionEyebrow accentColor={accentColor}>FAQ</DarkSectionEyebrow>
          <h2 className={styles.title}>{copy.sections.faq}</h2>
        </div>

        <div className={styles.accordion}>
          <div className={styles.column}>
            {startColumn.map((item, index) => (
              <DarkFaqAccordionItem key={`start-${index}-${item.question}`} item={item} />
            ))}
          </div>
          <div className={styles.column}>
            {endColumn.map((item, index) => (
              <DarkFaqAccordionItem key={`end-${index}-${item.question}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
