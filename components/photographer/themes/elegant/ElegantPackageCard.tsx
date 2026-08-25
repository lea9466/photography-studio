'use client'

import type { CSSProperties } from 'react'
import { getHomepageCopy } from '@/lib/homepage-copy'
import { isSiteLtr, type SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ElegantPackageCard.module.css'

/** Local prop shape for a package card — mirrors the fields generatePackagesHTML's
 * elegant branch reads off lib/homepage-themes/types.ts's `Package`
 * (id, name, price_amount, includes, is_featured), camelCased. Unlike
 * classic/dark's row layout, elegant (like modern) doesn't show a
 * duration/subtitle line. */
export type ElegantPackage = {
  id: string
  name: string
  priceAmount: number
  includes: string[]
  isFeatured: boolean
}

export type ElegantPackageCardProps = {
  pkg: ElegantPackage
  accentColor: string
  language: SiteLanguage
  /** Same-page anchor the CTA button scrolls to — a plain `<a href>`. */
  contactAnchorHref: string
  index: number
}

/**
 * Elegant theme's package card — 1:1 port of generatePackagesHTML's
 * `currentTheme === 'elegant'` branch (lib/homepage-themes/generate-homepage-html.ts,
 * line ~772). `pkgCenterStyle` (always centered, dir flips per language) is
 * applied once at the card root and inherited by every child instead of
 * being repeated on each element — `direction`/`text-align` both inherit.
 * The features list is the one exception: `pkgListStyle` deliberately
 * overrides back to right-aligned/RTL for Hebrew (the list content itself
 * reads right-to-left even though the `<ul>` box is horizontally centered
 * via `mx-auto w-fit`) — for English both styles already agree (centered),
 * so no override is needed there.
 */
export function ElegantPackageCard({ pkg, accentColor, language, contactAnchorHref, index }: ElegantPackageCardProps) {
  const copy = getHomepageCopy(language)
  const ltr = isSiteLtr(language)
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
    delayMs: index * 100,
  })

  const cardStyle = {
    direction: ltr ? 'ltr' : 'rtl',
    textAlign: 'center',
    '--elegant-accent': accentColor,
    ...(pkg.isFeatured ? { borderColor: accentColor } : {}),
  } as CSSProperties

  const listStyle: CSSProperties | undefined = ltr
    ? undefined
    : { direction: 'rtl', textAlign: 'right', paddingInlineEnd: 0, marginInlineEnd: 0 }

  return (
    <div
      ref={ref}
      className={`${styles.card} ${pkg.isFeatured ? styles.cardFeatured : ''} stagger-reveal ${revealed ? 'is-visible' : ''}`}
      style={cardStyle}
    >
      {pkg.isFeatured ? (
        <div className={styles.badge} style={{ backgroundColor: accentColor }}>
          {copy.packages.bestSeller}
        </div>
      ) : null}

      <div className={`${styles.heading} ${pkg.isFeatured ? styles.headingFeatured : ''}`}>
        <h3 className={styles.name} style={{ color: accentColor }}>
          {pkg.name}
        </h3>
        <div className={styles.price} style={{ color: pkg.isFeatured ? accentColor : 'inherit' }}>
          ₪{pkg.priceAmount}
        </div>
      </div>

      <div
        className={styles.divider}
        style={pkg.isFeatured ? { borderColor: `${accentColor}20` } : undefined}
      >
        <div className={styles.listWrap}>
          <ul className={`${styles.features} ${pkg.isFeatured ? styles.featuresFeatured : ''}`} style={listStyle}>
            {pkg.includes.map((item, i) => (
              <li key={i}>
                <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true" style={{ color: accentColor }}>
                  check
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.action}>
        <a href={contactAnchorHref} className={styles.btn}>
          {copy.packages.scheduleConsultation}
        </a>
      </div>
    </div>
  )
}
