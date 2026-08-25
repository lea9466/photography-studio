'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { DarkSectionEyebrow } from './DarkSectionEyebrow'
import { DarkPackageCard, type DarkPackage } from './DarkPackageCard'
import styles from './DarkPackagesSection.module.css'

export type DarkPackagesSectionProps = {
  title: string
  subtitle: string
  packages: DarkPackage[]
  accentColor: string
  language: SiteLanguage
  /** Same-page anchor the row CTAs scroll to. */
  contactAnchorHref?: string
}

/**
 * Dark theme's "Packages" section — 1:1 port of the `id="pricing"` block in
 * lib/homepage-themes/dark.ts (line ~1431). Header is LEFT-aligned/LTR here
 * (unlike galleries/recent-photos/posts) because CLASSIC_PACKAGES_ROWS_CSS
 * explicitly extends its `.theme-classic .homepage-packages-section__header
 * { text-align: left !important }` rule to `.theme-bold` too — dark's
 * packages/testimonials headers deliberately mirror classic's LTR layout,
 * while gallery/recent-photos/posts headers use dark's own separate LTR
 * override. Same visual result either way: eyebrow + title + divider, all
 * flush left.
 */
export function DarkPackagesSection({
  title,
  subtitle,
  packages,
  accentColor,
  language,
  contactAnchorHref = '#contact',
}: DarkPackagesSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  // Matches the old renderer: generatePackagesHTML returns '' once there are
  // no packages configured.
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
          <DarkSectionEyebrow accentColor={accentColor}>PACKAGES</DarkSectionEyebrow>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.divider} />
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.rows}>
          {packages.map((pkg) => (
            <DarkPackageCard
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
