'use client'

import Link from 'next/link'
import { useInView } from './useInView'
import styles from './nova.module.css'

const BRAND_NAME = 'STG'

export function NovaClosingCta() {
  const [ctaRef, ctaInView] = useInView()

  return (
    <section className={styles.closing} ref={ctaRef}>
      <div className={styles['closing-glow']} aria-hidden="true" />

      <div
        className={`${styles['closing-inner']} ${styles.container} ${styles.reveal} ${styles['delay-1']} ${ctaInView ? styles['in-view'] : ''}`}
      >
        <span className={styles['closing-eyebrow']}>✦ {BRAND_NAME}</span>
        <h2>מוכנה שהאתר שלך יֵראה כמו שהעבודה שלך ראויה לו?</h2>
        <p>בלי כרטיס אשראי, בלי התחייבות — אפשר להתחיל תוך דקות.</p>
        <Link href="/register" className={styles['closing-btn']}>
          להתחיל בחינם
        </Link>
      </div>
    </section>
  )
}
