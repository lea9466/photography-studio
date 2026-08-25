'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { SectionTitle } from '../shared/SectionTitle'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { ModernPackageCard, type ModernPackage } from './ModernPackageCard'
import styles from './ModernPackagesSection.module.css'

export type ModernPackagesSectionProps = {
  title: string
  subtitle: string
  packages: ModernPackage[]
  accentColor: string
  language: SiteLanguage
  /** Same-page anchor each card's CTA scrolls to. */
  contactAnchorHref?: string
}

/**
 * Modern-theme packages section — ports the `id="pricing"` block in
 * lib/homepage-themes/modern.ts (the `hasPackages` branch, ~line 1084-1104):
 * a centered eyebrow+title+subtitle header over `packagesGridClass`
 * (HOMEPAGE_PACKAGES_GRID_CSS — 3 columns desktop, centered 1-2up for small
 * counts, 1 column tablet/mobile), same grid classic-theme package rows
 * don't use (see ModernPackagesSection.module.css's doc comment).
 *
 * Packages are pre-sorted by the caller if a "featured package goes in the
 * middle of 3" reorder is wanted — mirrors the old renderer's `sortedPackages`
 * (generate-homepage-html.ts), which this component doesn't recompute.
 */
export function ModernPackagesSection({
  title,
  subtitle,
  packages,
  accentColor,
  language,
  contactAnchorHref = '#contact',
}: ModernPackagesSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  // Matches the old renderer: generatePackagesHTML returns '' (and the whole
  // <section id="pricing"> is skipped via hasPackages) once there are no
  // packages configured.
  if (packages.length === 0) return null

  const gridCountClass =
    packages.length === 1 ? styles.gridCount1 : packages.length === 2 ? styles.gridCount2 : ''

  return (
    <section
      ref={ref}
      id="pricing"
      className={`${styles.section} stagger-reveal ${revealed ? 'is-visible' : ''}`}
    >
      <div aria-hidden="true" className={styles.glow} style={{ background: `linear-gradient(to right, ${accentColor}4d, transparent)` }} />

      <div className={styles.inner}>
        <div className={styles.header} style={{ '--modern-accent': accentColor } as React.CSSProperties}>
          <ModernSectionEyebrow align="center">PACKAGES</ModernSectionEyebrow>
          <SectionTitle color="#0f172a" style={{ textAlign: 'center' }}>
            {title}
          </SectionTitle>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={`${styles.grid} ${gridCountClass}`}>
          {packages.map((pkg, index) => (
            <ModernPackageCard
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
