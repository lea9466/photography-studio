'use client'

import type { CSSProperties } from 'react'
import type { FaqItem } from '@/lib/faq'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ElegantFaqMagazineItem.module.css'

export type ElegantFaqMagazineItemProps = {
  item: FaqItem
  index: number
  featured: boolean
  accentColor: string
}

/**
 * Elegant theme's FAQ item — 1:1 port of generateMagazineFaqItemsHTML's
 * `faq-magazine-item*` markup (lib/homepage-themes/generate-homepage-html.ts)
 * with magazineFaqGridCss()'s `.theme-elegant .faq-magazine-item*` rules
 * (lib/homepage-themes/shared-styles.ts) — the grid/layout shell is byte-for-byte
 * identical to classic's (grouped under the same selectors in the source), only
 * the question/answer typography differs (plain 'Heebo' here vs classic's
 * headline-serif + bold). Uses `reveal-on-scroll`/`active` (elegant's own
 * IntersectionObserver class pair, elegant-theme.css) rather than classic's
 * `reveal`/`active` or the posts/packages `stagger-reveal` pair — matches the
 * literal `revealClass = variant === 'elegant' ? 'reveal-on-scroll' : 'reveal'`
 * branch in the source.
 */
export function ElegantFaqMagazineItem({ item, index, featured, accentColor }: ElegantFaqMagazineItemProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const indexLabel = String(index + 1).padStart(2, '0')
  const style = {
    '--faq-accent': accentColor,
    transitionDelay: `${index * 80}ms`,
  } as CSSProperties

  return (
    <article
      ref={ref}
      data-featured={featured ? 'true' : 'false'}
      className={`${styles.item} ${featured ? styles.itemFeatured : ''} reveal-on-scroll ${revealed ? 'active' : ''}`}
      style={style}
    >
      <div className={styles.itemHeading}>
        <span className={styles.itemNumber} aria-hidden="true">
          {indexLabel}
        </span>
        <h3 className={styles.itemQuestion}>{item.question}</h3>
      </div>
      <p className={styles.itemAnswer}>{item.answer}</p>
    </article>
  )
}
