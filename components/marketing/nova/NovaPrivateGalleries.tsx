'use client'

import Image from 'next/image'
import { useInView } from './useInView'
import styles from './nova.module.css'

export function NovaPrivateGalleries() {
  const [privateRef, privateInView] = useInView()

  return (
    <section className={styles.private} id="private" ref={privateRef}>
      <div className={styles['private-split']}>
        <div className={styles['private-text']}>
          <div className={`${styles['reveal-strong']} ${styles['delay-1']} ${privateInView ? styles['in-view'] : ''}`}>
            <span className={styles['hero-eyebrow']}>✦ גלריות פרטיות</span>
            <h2>מרחב אישי ומאובטח לכל לקוחה</h2>
            <p>
              כל לקוחה מקבלת קישור פרטי משלה — בוחרת, מורידה, ונהנית מהתמונות שלה בלי שאף אחד
              אחר יראה אותן.
            </p>
          </div>

          <div className={styles['private-features']}>
            <div
              className={`${styles['private-feature']} ${styles['reveal-strong']} ${styles['feature-delay-1']} ${privateInView ? styles['in-view'] : ''}`}
            >
              <span className={styles['private-caption-icon']}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M9 11.5l2 2 4-4.5" />
                  <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
                </svg>
              </span>
              <span>בוחרת תמונות בצורה נוחה</span>
            </div>

            <div
              className={`${styles['private-feature']} ${styles['reveal-strong']} ${styles['feature-delay-2']} ${privateInView ? styles['in-view'] : ''}`}
            >
              <span className={styles['private-caption-icon']}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 4v11M7.5 11.5L12 16l4.5-4.5" />
                  <path d="M4.5 18.5h15" />
                </svg>
              </span>
              <span>מורידה תמונות מעובדות</span>
            </div>

            <div
              className={`${styles['private-feature']} ${styles['reveal-strong']} ${styles['feature-delay-3']} ${privateInView ? styles['in-view'] : ''}`}
            >
              <span className={styles['private-caption-icon']}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 4.5l6.5 3v6c0 4-2.7 6.7-6.5 8-3.8-1.3-6.5-4-6.5-8v-6z" />
                  <path d="M9.3 12l1.8 1.8 3.5-3.8" />
                </svg>
              </span>
              <span>התמונות פתוחות וזמינות גם בנטפרי</span>
            </div>
          </div>
        </div>

        <div
          className={`${styles['private-visual']} ${styles['reveal-strong-visual']} ${styles['delay-2']} ${privateInView ? styles['in-view'] : ''}`}
        >
          <div className={styles['hero-glow']} aria-hidden="true" />
          <Image
            className={styles['private-laptop-shot']}
            src="/marketing/nova/private-laptop.webp"
            width={1536}
            height={1024}
            alt="גלריה פרטית מוצגת במחשב נייד, עם תמונות לבחירה"
          />
        </div>
      </div>
    </section>
  )
}
