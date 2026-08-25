import Link from 'next/link'
import type { SiteLanguage } from '@/lib/site-language'
import { homepageSectionHref } from '@/lib/photographer-site-paths'
import { getPublicGalleryContactLabel, getPublicGalleryDefaultCta } from '@/lib/public-gallery-copy'
import styles from './ElegantPortfolioContactCard.module.css'

export type ElegantPortfolioContactCardProps = {
  title: string | null
  description: string | null
  accentColor: string
  /** The portfolio page lives at its own path — this CTA links back to the homepage's contact section. */
  homepagePath: string
  language: SiteLanguage
}

/**
 * Elegant-theme portfolio contact CTA — see
 * ElegantPortfolioContactCard.module.css's doc comment: this section's
 * colors come from generatePublicContactCardSection()'s shared default
 * bucket (no dedicated elegant branch exists), which happens to literally
 * match classic's palette — a real quirk of the source, not a mistake in
 * this port. `accentColor` is accepted for prop-shape parity with the other
 * themes' equivalent component, but (like the old renderer) is unused here —
 * the button and text colors are fixed, not per-studio.
 */
export function ElegantPortfolioContactCard({
  title,
  description,
  homepagePath,
  language,
}: ElegantPortfolioContactCardProps) {
  const defaults = getPublicGalleryDefaultCta(language)
  const resolvedTitle = title?.trim() || defaults.title
  const resolvedDescription = description?.trim() || defaults.description
  const buttonLabel = getPublicGalleryContactLabel(language)
  const href = homepageSectionHref(homepagePath, 'contact')

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.title}>{resolvedTitle}</h2>
        <p className={styles.description}>{resolvedDescription}</p>
        <Link href={href} className={styles.button}>
          {buttonLabel}
        </Link>
      </div>
    </section>
  )
}
