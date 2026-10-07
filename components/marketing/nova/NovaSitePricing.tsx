'use client'

import Link from 'next/link'
import { useInView } from './useInView'
import styles from './nova.module.css'
import type { MarketingProPricing } from '@/lib/payments/marketing-pricing'

type NovaSitePricingProps = {
  pricing: MarketingProPricing
}

// Capability copy, not priced numbers — same bullets the previous homepage's
// SitePricing.tsx used, authored here rather than pulled from a table, same
// as every other section's feature copy on this page.
const FREE_FEATURES = ['סקשן הירו ואודות', 'גלריה ציבורית אחת', 'טופס יצירת קשר', 'מופיעים בחיפוש בגוגל']
const PRO_FEATURES = [
  'כל מודולי אתר התדמית — בלוג, המלצות, חבילות, לפני/אחרי, שאלות ותשובות',
  'עד 4 גלריות ציבוריות',
  'וידאו רקע בהירו',
]

function CheckIcon() {
  return (
    <svg className={styles['pricing-check']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

/**
 * Packages for the public-site product, placed right after its own
 * description (NovaShowcase + NovaHowItWorks) — see NovaHome's composition.
 * `pricing` is fetched once in NovaHome (getMarketingProPricing, reads
 * subscription_plans) and passed down, same pattern as NovaStats's `stats`.
 * The free card's ₪0 is the one number not from a table — there's no DB row
 * for "free".
 */
export function NovaSitePricing({ pricing }: NovaSitePricingProps) {
  // The default threshold alone fires while only this section's own
  // 100px/130px padding is on screen (ratio ~0.95 measured — the header was
  // still almost a full viewport-height below the fold) — same bug as
  // NovaPrivateGalleries, same fix: hold the trigger until the content
  // itself has actually come up into view. See useInView's own doc comment.
  const [ref, inView] = useInView(0.15, '0px 0px -18% 0px')

  return (
    <section className={styles.pricing} ref={ref}>
      <div className={styles['pricing-inner']}>
        <div className={`${styles['pricing-header']} ${styles.reveal} ${inView ? styles['in-view'] : ''}`}>
          <span className={styles['hero-eyebrow']}>✦ מחירים</span>
          <h2>חבילת האתר שלך</h2>
          <p>שבועיים ראשונים חינם ברמת Pro, בלי כרטיס אשראי. אחר כך אפשר להישאר במסלול החינמי לתמיד.</p>
        </div>

        <div className={styles['pricing-grid']}>
          <div
            className={`${styles['pricing-card']} ${styles['reveal-strong']} ${styles['card-delay-1']} ${inView ? styles['in-view'] : ''}`}
          >
            <div className={styles['pricing-card-head']}>
              <h3 className={styles['pricing-name']}>חינם</h3>
            </div>
            <p className={styles['pricing-subtitle']}>אתר תדמית בסיסי, לתמיד</p>
            <p className={styles['pricing-amount']}>₪0</p>
            <ul className={styles['pricing-features']}>
              {FREE_FEATURES.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className={`${styles['secondary-btn']} ${styles['pricing-btn']}`}>
              התחילי בחינם
            </Link>
          </div>

          <div
            className={`${styles['pricing-card']} ${styles['reveal-strong']} ${styles['card-delay-2']} ${inView ? styles['in-view'] : ''}`}
          >
            <div className={styles['pricing-card-head']}>
              <h3 className={styles['pricing-name']}>Pro</h3>
              {pricing.monthlyBadge ? <span className={styles['pricing-badge']}>{pricing.monthlyBadge}</span> : null}
            </div>
            <p className={styles['pricing-subtitle']}>כל הכלים לאתר מקצועי · שבועיים ראשונים חינם</p>
            <p className={styles['pricing-amount']}>
              ₪{pricing.monthlyPrice}
              <span className={styles['pricing-amount-unit']}>לחודש</span>
              {pricing.monthlyCompareAt ? (
                <span className={styles['pricing-compare']}>₪{pricing.monthlyCompareAt}</span>
              ) : null}
            </p>
            <p className={styles['pricing-yearly-note']}>
              או ₪{pricing.yearlyPrice} לשנה
              {pricing.yearlyCompareAt ? ` במקום ₪${pricing.yearlyCompareAt}` : ''}
              {pricing.yearlyBadge ? ` — ${pricing.yearlyBadge}` : ''}
            </p>
            <ul className={styles['pricing-features']}>
              {PRO_FEATURES.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className={`${styles['primary-btn']} ${styles['pricing-btn']}`}>
              התחילי עכשיו בחינם
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
