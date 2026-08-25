'use client'

import type { CSSProperties } from 'react'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { SectionTitle } from '../shared/SectionTitle'
import { ClassicSectionScript } from './ClassicSectionScript'
import { ClassicFaqMagazineItem } from './ClassicFaqMagazineItem'
import styles from './ClassicFaqSection.module.css'

export type ClassicFaqSectionProps = {
  /** Raw photographer.faq_items — parsed/sanitized the same way the old
   * renderer did (parseFaqItems + sanitizeFaqItems from lib/faq.ts). */
  faqItems: unknown
  faqSectionImageUrl: string | null
  accentColor: string
  language: SiteLanguage
}

export function ClassicFaqSection({ faqItems, faqSectionImageUrl, accentColor, language }: ClassicFaqSectionProps) {
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
      className={`reveal ${revealed ? 'active' : ''} ${styles.section} ${withImage ? styles.withImage : ''} py-20`}
      style={sectionStyle}
    >
      <div ref={headerRef} className={`${styles.header} ${headerRevealed ? styles.headerVisible : ''}`}>
        <ClassicSectionScript color={accentColor}>FAQ</ClassicSectionScript>
        <SectionTitle color="#2d2825">{copy.sections.faq}</SectionTitle>
        <div className="mt-4 mr-auto ml-0 h-px w-12 bg-[#d1c6b4]" />
        <p className={styles.subtitle}>{copy.sections.faqSubtitle}</p>
      </div>

      <div className={styles.magazineWrap}>
        {withImage ? (
          <div className={styles.layoutWithImage}>
            <div className={styles.content}>
              <div className={`${styles.grid} ${styles.gridStacked}`}>
                {items.map((item, index) => (
                  <ClassicFaqMagazineItem
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
              <ClassicFaqMagazineItem
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
