'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { SectionTitle } from '../shared/SectionTitle'
import { ClassicPackageCard, type ClassicPackage } from './ClassicPackageCard'
import { ClassicSectionScript } from './ClassicSectionScript'
import styles from './ClassicPackagesSection.module.css'

export type ClassicPackagesSectionProps = {
  title: string
  subtitle: string
  packages: ClassicPackage[]
  accentColor: string
  language: SiteLanguage
  /** Same-page anchor the row CTAs scroll to. */
  contactAnchorHref?: string
}

export function ClassicPackagesSection({
  title,
  subtitle,
  packages,
  accentColor,
  language,
  contactAnchorHref = '#contact',
}: ClassicPackagesSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  // Matches the old renderer: generatePackagesHTML returns '' (and the whole
  // <section id="pricing"> is skipped via hasPackages) once there are no
  // packages configured.
  if (packages.length === 0) return null

  return (
    <section
      ref={ref}
      id="pricing"
      className={`${styles.section} reveal ${revealed ? 'active' : ''} relative overflow-hidden py-20`}
    >
      <div
        aria-hidden="true"
        className={`${styles.glow} ${styles.glowLeft}`}
        style={{
          background: `radial-gradient(circle, ${accentColor}70 0%, ${accentColor}45 24%, ${accentColor}22 46%, transparent 72%)`,
        }}
      />
      <div
        aria-hidden="true"
        className={`${styles.glow} ${styles.glowRight}`}
        style={{
          background: `radial-gradient(circle, ${accentColor}80 0%, ${accentColor}50 26%, ${accentColor}28 48%, transparent 74%)`,
        }}
      />

      <div className={`${styles.inner} relative z-10`}>
        <div className={styles.header}>
          <ClassicSectionScript color={accentColor}>Packages</ClassicSectionScript>
          <SectionTitle color="#2d2825">{title}</SectionTitle>
          <div className={styles.divider} />
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.rows}>
          {packages.map((pkg) => (
            <ClassicPackageCard
              key={pkg.id}
              pkg={pkg}
              accentColor={accentColor}
              language={language}
              contactAnchorHref={contactAnchorHref}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
