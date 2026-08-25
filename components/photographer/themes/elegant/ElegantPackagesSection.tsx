'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ElegantSectionHeading } from './ElegantSectionHeading'
import { ElegantPackageCard, type ElegantPackage } from './ElegantPackageCard'
import styles from './ElegantPackagesSection.module.css'

export type ElegantPackagesSectionProps = {
  title: string
  subtitle: string
  packages: ElegantPackage[]
  accentColor: string
  language: SiteLanguage
  /** Same-page anchor the card CTAs scroll to. */
  contactAnchorHref?: string
}

/**
 * Elegant theme's "Packages" section — 1:1 port of the `id="pricing"` block
 * in lib/homepage-themes/elegant.ts (line ~1195). Header is CENTERED here
 * (`elegantSectionHeading(..., { center: true })`), unlike
 * galleries/recent-photos/posts. When exactly 3 packages exist and one is
 * featured, generate-homepage-html.ts's `sortedPackages` moves it to the
 * middle slot — same reorder applied here before rendering.
 */
export function ElegantPackagesSection({
  title,
  subtitle,
  packages,
  accentColor,
  language,
  contactAnchorHref = '#contact',
}: ElegantPackagesSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>()

  // Matches the old renderer: generatePackagesHTML returns '' once there are
  // no packages configured.
  if (packages.length === 0) return null

  const sortedPackages = (() => {
    if (packages.length === 3) {
      const featuredIndex = packages.findIndex((pkg) => pkg.isFeatured)
      if (featuredIndex !== -1) {
        const copy = [...packages]
        const [featured] = copy.splice(featuredIndex, 1)
        copy.splice(1, 0, featured)
        return copy
      }
    }
    return packages
  })()

  const gridClass =
    packages.length === 1
      ? `${styles.grid} ${styles.gridCount1}`
      : packages.length === 2
        ? `${styles.grid} ${styles.gridCount2}`
        : styles.grid

  return (
    <section id="pricing" className={`${styles.section} relative overflow-hidden py-16 md:py-32`}>
      <div aria-hidden="true" className={styles.glow} style={{ background: `linear-gradient(to right, color-mix(in srgb, ${accentColor} 30%, transparent), transparent)` }} />

      <div className={`${styles.inner} relative z-10`}>
        <div ref={ref} className={`${styles.header} stagger-reveal ${revealed ? 'is-visible' : ''}`}>
          <ElegantSectionHeading title={title} watermark="PACKAGES" accentColor={accentColor} align="center" />
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={gridClass}>
          {sortedPackages.map((pkg, index) => (
            <ElegantPackageCard
              key={pkg.id}
              pkg={pkg}
              accentColor={accentColor}
              language={language}
              contactAnchorHref={contactAnchorHref}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
