'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { useInView } from './useInView'
import styles from './nova.module.css'

const BRAND_NAME = 'STG'

const HEADLINE = 'מוכנה שהאתר שלך יֵראה כמו שהעבודה שלך ראויה לו?'
// split per word (never per letter — that would break Hebrew letter joining
// and the nikud), so each word can enter on its own beat
const HEADLINE_WORDS = HEADLINE.split(' ')

// entrance choreography, in seconds — the paragraph and button delays live in
// nova.module.css (.closing-delay-*) and pick up where the last word lands
const WORDS_START = 0.35
const WORDS_STEP = 0.07

export function NovaClosingCta() {
  // higher than the default: this section's content sits well below its top
  // edge (110px padding), so wait until the text itself is on screen
  const [ctaRef, ctaInView] = useInView(0.35)

  return (
    <section className={`${styles.closing} ${ctaInView ? styles['in-view'] : ''}`} ref={ctaRef}>
      <div className={styles['closing-glow']} aria-hidden="true" />

      <div className={`${styles['closing-inner']} ${styles.container}`}>
        <span className={`${styles['closing-eyebrow']} ${styles['closing-item']}`}>✦ {BRAND_NAME}</span>
        <h2>
          {HEADLINE_WORDS.map((word, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              <span
                className={styles['closing-word']}
                style={{ animationDelay: `${WORDS_START + i * WORDS_STEP}s` }}
              >
                {word}
              </span>
            </Fragment>
          ))}
        </h2>
        <p className={`${styles['closing-item']} ${styles['closing-delay-text']}`}>
          בלי כרטיס אשראי, בלי התחייבות — אפשר להתחיל תוך דקות.
        </p>
        <Link
          href="/register"
          className={`${styles['closing-btn']} ${styles['closing-item']} ${styles['closing-delay-btn']}`}
        >
          להתחיל בחינם
        </Link>
      </div>
    </section>
  )
}
