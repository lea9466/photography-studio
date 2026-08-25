'use client'

import type { CSSProperties } from 'react'
import type { FaqItem } from '@/lib/faq'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ClassicFaqMagazineItem.module.css'

export type ClassicFaqMagazineItemProps = {
  item: FaqItem
  index: number
  featured: boolean
  accentColor: string
}

export function ClassicFaqMagazineItem({ item, index, featured, accentColor }: ClassicFaqMagazineItemProps) {
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
      className={`${styles.item} ${featured ? styles.itemFeatured : ''} reveal ${revealed ? 'active' : ''}`}
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
