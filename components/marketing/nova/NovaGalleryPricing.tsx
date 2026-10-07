'use client'

import Link from 'next/link'
import { useInView } from './useInView'
import styles from './nova.module.css'
import type { MarketingGalleryPricing } from '@/lib/payments/marketing-pricing'

type NovaGalleryPricingProps = {
  pricing: MarketingGalleryPricing
}

function CheckIcon() {
  return (
    <svg className={styles['pricing-check']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

/**
 * Packages for the private-galleries product, placed right after its own
 * description (NovaPrivateGalleries) — see NovaHome's composition. `pricing`
 * is fetched once in NovaHome (getMarketingPrivateGalleryPricing, reads
 * subscription_plans + private_gallery_tiers) and passed down — every number
 * here, free tier included, comes from those two tables, not this file.
 */
export function NovaGalleryPricing({ pricing }: NovaGalleryPricingProps) {
  // Same fix as NovaSitePricing, same root cause — see its comment.
  const [ref, inView] = useInView(0.15, '0px 0px -18% 0px')

  return (
    <section className={styles.pricing} ref={ref}>
      <div className={styles['pricing-inner']}>
        <div className={`${styles['pricing-header']} ${styles.reveal} ${inView ? styles['in-view'] : ''}`}>
          <span className={styles['hero-eyebrow']}>✦ מחירים</span>
          <h2>חבילות הגלריות הפרטיות</h2>
          <p>גלריה פרטית ראשונה חינם, ללא הגבלת זמן. משדרגות למספר גלריות במקביל כשצריך יותר.</p>
        </div>

        <div className={`${styles['pricing-grid']} ${styles['pricing-grid-galleries']}`}>
          <div
            className={`${styles['pricing-card']} ${styles['reveal-strong']} ${styles['card-delay-1']} ${inView ? styles['in-view'] : ''}`}
          >
            <div className={styles['pricing-card-head']}>
              <h3 className={styles['pricing-name']}>חינם</h3>
            </div>
            <p className={styles['pricing-subtitle']}>לנסות בלי סיכון</p>
            <p className={styles['pricing-amount']}>₪0</p>
            <ul className={styles['pricing-features']}>
              <li>
                <CheckIcon />
                גלריה פרטית אחת{pricing.free.isLifetimeCap ? ', לכל החיים' : ' במקביל'}
              </li>
              <li>
                <CheckIcon />
                עד {pricing.free.maxPhotosPerGallery} תמונות בגלריה
              </li>
            </ul>
            <Link href="/register" className={`${styles['secondary-btn']} ${styles['pricing-btn']}`}>
              התחילי בחינם
            </Link>
          </div>

          {pricing.paid.map((tier, i) => (
            <div
              key={tier.tier}
              className={`${styles['pricing-card']} ${styles['reveal-strong']} ${styles[`card-delay-${Math.min(i + 2, 4)}`]} ${inView ? styles['in-view'] : ''}`}
            >
              <div className={styles['pricing-card-head']}>
                <h3 className={styles['pricing-name']}>{tier.name}</h3>
                {tier.badge ? <span className={styles['pricing-badge']}>{tier.badge}</span> : null}
              </div>
              <p className={styles['pricing-subtitle']}>ניהול גלריות פרטיות</p>
              <p className={styles['pricing-amount']}>
                ₪{tier.price}
                <span className={styles['pricing-amount-unit']}>לחודש</span>
                {tier.compareAt != null ? <span className={styles['pricing-compare']}>₪{tier.compareAt}</span> : null}
              </p>
              <ul className={styles['pricing-features']}>
                <li>
                  <CheckIcon />
                  עד {tier.maxGalleries} גלריות פרטיות במקביל
                </li>
                <li>
                  <CheckIcon />
                  עד {tier.maxPhotosPerGallery} תמונות לגלריה
                </li>
              </ul>
              <Link href="/register" className={`${styles['primary-btn']} ${styles['pricing-btn']}`}>
                להתחיל עכשיו
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
