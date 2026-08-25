import type { CSSProperties } from 'react'
import { getHomepageCopy } from '@/lib/homepage-copy'
import { isSiteLtr, type SiteLanguage } from '@/lib/site-language'
import styles from './ClassicPackageCard.module.css'

/** Local prop shape for a package row — mirrors the fields generatePackagesHTML's
 * classic branch actually reads off lib/homepage-themes/types.ts's `Package`
 * (id, name, price_amount, duration_text, includes, is_featured), camelCased. */
export type ClassicPackage = {
  id: string
  name: string
  priceAmount: number
  durationText: string | null
  includes: string[]
  isFeatured: boolean
}

export type ClassicPackageCardProps = {
  pkg: ClassicPackage
  accentColor: string
  language: SiteLanguage
  /** Same-page anchor the price button scrolls to — a plain `<a href>`,
   * replacing the old renderer's `onclick="document.querySelector(...)"`. */
  contactAnchorHref: string
}

export function ClassicPackageCard({ pkg, accentColor, language, contactAnchorHref }: ClassicPackageCardProps) {
  const copy = getHomepageCopy(language)
  const subtitle = pkg.durationText || (pkg.isFeatured ? copy.packages.fullExperience : copy.packages.smallMoments)
  const dir = isSiteLtr(language) ? 'ltr' : 'rtl'
  const rowStyle = { '--primary-color': accentColor } as CSSProperties

  return (
    <div className={`${styles.row} ${pkg.isFeatured ? styles.rowFeatured : ''}`} style={rowStyle}>
      <div className={styles.title}>
        {pkg.isFeatured ? <span className={styles.badge}>{copy.packages.bestSeller}</span> : null}
        <h3 className={styles.name}>{pkg.name}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.features} dir={dir}>
        <ul className={styles.featuresGrid}>
          {pkg.includes.map((item, i) => (
            <li key={i}>
              {/* material-symbols-outlined is the same global icon-font class the
                  old markup used; font loading is a layout-level concern (see
                  classic-theme.css), not something this component owns. */}
              <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
                {pkg.isFeatured ? 'check_circle' : 'check'}
              </span>
              <span className={styles.itemText}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.action}>
        <div className={styles.price}>
          <span className={styles.priceCurrency}>₪</span>
          {pkg.priceAmount}
        </div>
        <a
          href={contactAnchorHref}
          className={`${styles.btn} ${pkg.isFeatured ? styles.btnFeatured : styles.btnDefault}`}
        >
          {pkg.isFeatured ? copy.packages.selectPackage : copy.packages.orderPackage}
        </a>
      </div>
    </div>
  )
}
