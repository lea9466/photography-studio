import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ModernPackageCard.module.css'

/** Local prop shape for a package card — mirrors the fields generatePackagesHTML's
 * modern branch actually reads off lib/homepage-themes/types.ts's `Package`
 * (id, name, price_amount, includes, is_featured), camelCased. Unlike
 * classic's row layout, modern doesn't show a duration/subtitle line. */
export type ModernPackage = {
  id: string
  name: string
  priceAmount: number
  includes: string[]
  isFeatured: boolean
}

export type ModernPackageCardProps = {
  pkg: ModernPackage
  accentColor: string
  language: SiteLanguage
  /** Same-page anchor the CTA button scrolls to — a plain `<a href>`. */
  contactAnchorHref: string
  index: number
}

export function ModernPackageCard({ pkg, accentColor, language, contactAnchorHref, index }: ModernPackageCardProps) {
  const copy = getHomepageCopy(language)
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
    delayMs: index * 100,
  })

  return (
    <div
      ref={ref}
      className={`${styles.card} ${pkg.isFeatured ? styles.cardFeatured : ''} stagger-reveal ${revealed ? 'is-visible' : ''}`}
      style={{ '--modern-accent': accentColor } as React.CSSProperties}
    >
      {pkg.isFeatured ? <span className={styles.badge}>{copy.packages.bestSeller}</span> : null}

      <div className={styles.heading}>
        <h3 className={styles.name}>{pkg.name}</h3>
        <div className={styles.price}>₪{pkg.priceAmount}</div>
      </div>

      <ul className={styles.features}>
        {pkg.includes.map((item, i) => (
          <li key={i}>
            {/* material-symbols-outlined is the same global icon-font class the
                old markup used; font loading is a layout-level concern, not
                something this component owns. */}
            <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
              check_circle
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <a
        href={contactAnchorHref}
        className={`${styles.btn} ${pkg.isFeatured ? styles.btnFeatured : styles.btnDefault}`}
      >
        {copy.packages.orderNow}
      </a>
    </div>
  )
}
