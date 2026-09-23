'use client'

import { Fragment } from 'react'
import { useInView } from './useInView'
import styles from './nova.module.css'

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 19V8a2 2 0 0 1 2-2h7l4 4v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M9 13.5l2 2 4-4.5" />
      </svg>
    ),
    title: 'הרשמה מהירה',
    text: 'נרשמים תוך דקה, בלי התחייבות.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M4 16.5l5-4.5 3.5 3 3-2.5 4.5 4" />
      </svg>
    ),
    title: 'מעצבים את הזהות שלך',
    text: 'מעלים תמונת רקע ולוגו, ובוחרים ערכת נושא וצבע ראשי.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
        <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
        <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
        <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
      </svg>
    ),
    title: 'מוסיפים תוכן',
    text: 'מעלים גלריות, פוסטים ועוד — הכל מאותו מקום.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="11" cy="11" r="7" />
        <path d="M20.5 20.5L16 16" />
        <path d="M8.5 11l1.8 1.8L14 9.2" />
      </svg>
    ),
    title: 'האתר באוויר',
    text: 'תוך כמה ימים האתר נכנס לחיפוש של גוגל, והקישור ללקוחות מוכן מיד.',
  },
] as const

export function NovaHowItWorks() {
  const [stepsRef, stepsInView] = useInView()

  return (
    <section className={styles.how} id="how">
      <div className={styles['how-inner']}>
        <div
          className={`${styles['showcase-header']} ${styles.reveal} ${styles['delay-1']} ${stepsInView ? styles['in-view'] : ''}`}
        >
          <span className={styles['hero-eyebrow']}>✦ איך זה עובד</span>
          <h2>מההרשמה ועד שהאתר באוויר</h2>
        </div>

        <div className={styles.steps} ref={stepsRef}>
          {STEPS.map((step, i) => (
            <Fragment key={step.title}>
              <div
                className={`${styles['step-card']} ${styles.reveal} ${styles[`step-delay-${i + 1}`]} ${stepsInView ? styles['in-view'] : ''}`}
              >
                <span className={styles['step-number']}>{String(i + 1).padStart(2, '0')}</span>
                <div className={styles['step-icon']}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>

              {i < STEPS.length - 1 ? (
                <div
                  className={`${styles['step-arrow']} ${styles.reveal} ${styles[`step-delay-${i + 1}`]} ${stepsInView ? styles['in-view'] : ''}`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
