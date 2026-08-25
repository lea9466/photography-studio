'use client'

import type { CSSProperties } from 'react'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ElegantSectionHeading } from './ElegantSectionHeading'
import { ElegantFaqMagazineItem } from './ElegantFaqMagazineItem'
import styles from './ElegantFaqSection.module.css'

export type ElegantFaqSectionProps = {
  /** Raw photographer.faq_items — parsed/sanitized the same way the old
   * renderer did (parseFaqItems + sanitizeFaqItems from lib/faq.ts). */
  faqItems: unknown
  faqSectionImageUrl: string | null
  accentColor: string
  language: SiteLanguage
}

/**
 * Elegant theme's FAQ section — 1:1 port of generateFaqSectionHTML's
 * `currentTheme === 'elegant'` branch (lib/homepage-themes/generate-homepage-html.ts,
 * line ~1249) together with generateMagazineFaqBodyHTML/generateMagazineFaqItemsHTML.
 * Header is LTR/flush-left via `elegantFaqSectionCss()`'s shared
 * `.faq-section__header` rule (same function that styles the testimonials
 * header), matching ElegantSectionHeading's `align="start"`.
 */
export function ElegantFaqSection({ faqItems, faqSectionImageUrl, accentColor, language }: ElegantFaqSectionProps) {
  const items = sanitizeFaqItems(parseFaqItems(faqItems))
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const { ref: headerRef, revealed: headerRevealed } = useRevealOnScroll<HTMLDivElement>()

  // Matches the old renderer: generateFaqSectionHTML returns '' when there
  // are no valid FAQ items — the section doesn't exist at all. The reveal
  // hooks above are still called unconditionally (rules of hooks).
  if (items.length === 0) return null

  const copy = getHomepageCopy(language)
  const withImage = Boolean(faqSectionImageUrl)

  const sectionStyle = withImage
    ? ({ '--faq-section-bg-image': `url('${faqSectionImageUrl}')` } as CSSProperties)
    : undefined

  return (
    <section
      ref={ref}
      id="faq"
      className={`${styles.section} reveal-on-scroll ${revealed ? 'active' : ''} ${withImage ? styles.withImage : ''}`}
      style={sectionStyle}
    >
      <div ref={headerRef} className={`${styles.header} reveal-on-scroll ${headerRevealed ? 'active' : ''}`}>
        <ElegantSectionHeading title={copy.sections.faq} watermark="FAQ" accentColor={accentColor} align="start" />
        <p className={styles.subtitle}>{copy.sections.faqSubtitle}</p>
      </div>

      <div className={styles.magazineWrap}>
        {withImage ? (
          <div className={styles.layoutWithImage}>
            <div className={styles.content}>
              <div className={`${styles.grid} ${styles.gridStacked}`}>
                {items.map((item, index) => (
                  <ElegantFaqMagazineItem
                    key={`${item.question}-${index}`}
                    item={item}
                    index={index}
                    featured={false}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            </div>
            <div className={styles.feature}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={faqSectionImageUrl ?? ''} alt="" className={styles.featureImage} loading="lazy" decoding="async" />
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((item, index) => (
              <ElegantFaqMagazineItem
                key={`${item.question}-${index}`}
                item={item}
                index={index}
                featured={index === 0}
                accentColor={accentColor}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
