'use client'

import { useState } from 'react'
import { useInView } from './useInView'
import styles from './nova.module.css'

const EXAMPLE_PATH = '/lea-studio'

export function NovaShowcase() {
  const [showcaseRef, showcaseInView] = useInView()
  // Tracks each iframe's own load event — an <iframe> shows a blank white
  // canvas of its own until the framed document has actually painted, no
  // matter what background the parent page sets on the <iframe> tag itself.
  // A dark overlay that fades out on load hides that flash instead.
  const [computerLoaded, setComputerLoaded] = useState(false)
  const [phoneLoaded, setPhoneLoaded] = useState(false)

  return (
    <section className={styles.showcase} ref={showcaseRef}>
      <div className={styles['showcase-inner']}>
        <div
          className={`${styles['showcase-header']} ${styles.reveal} ${styles['delay-1']} ${showcaseInView ? styles['in-view'] : ''}`}
        >
          <span className={styles['hero-eyebrow']}>✦ אתר דוגמה</span>
          <h2>כך זה נראה בפועל — במחשב ובטלפון</h2>
          <p>לא הדמיה — כך האתר שלך יתאים את עצמו אוטומטית לכל מסך, בלי שתצטרכי לגעת בכלום.</p>
        </div>

        <div className={styles['device-row']}>
          <div
            className={`${styles['device-col']} ${styles['device-col-computer']} ${styles.reveal} ${styles['delay-2']} ${showcaseInView ? styles['in-view'] : ''}`}
          >
            <div className={styles['device-caption']}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="2.5" y="4.5" width="19" height="13" rx="1.5" />
                <path d="M8 21h8M12 17.5V21" />
              </svg>
              תצוגת מחשב
            </div>

            <div className={`${styles['device-panel']} ${styles['device-panel-computer']}`}>
              <div className={styles['browser-bar']}>
                <span />
                <span />
                <span />
                <div className={styles['browser-url']}>studio-galleries.com{EXAMPLE_PATH}</div>
              </div>

              <div className={styles['device-screen']}>
                <iframe
                  className={styles['device-iframe']}
                  src={EXAMPLE_PATH}
                  title="תצוגת מחשב של אתר שנבנה במערכת"
                  loading="lazy"
                  onLoad={() => setComputerLoaded(true)}
                />
                <div
                  className={`${styles['device-loading']} ${computerLoaded ? styles['device-loaded'] : ''}`}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div
            className={`${styles['device-col']} ${styles['device-col-phone']} ${styles.reveal} ${styles['delay-3']} ${showcaseInView ? styles['in-view'] : ''}`}
          >
            <div className={styles['device-caption']}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="6.5" y="2.5" width="11" height="19" rx="2.2" />
                <path d="M10.5 18.5h3" />
              </svg>
              תצוגת טלפון
            </div>

            <div className={`${styles['device-panel']} ${styles['device-panel-phone']}`}>
              <div className={styles['device-notch']} aria-hidden="true" />
              <div className={styles['device-screen']}>
                <iframe
                  className={styles['device-iframe']}
                  src={EXAMPLE_PATH}
                  title="תצוגת טלפון של אתר שנבנה במערכת"
                  loading="lazy"
                  onLoad={() => setPhoneLoaded(true)}
                />
                <div
                  className={`${styles['device-loading']} ${phoneLoaded ? styles['device-loaded'] : ''}`}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
