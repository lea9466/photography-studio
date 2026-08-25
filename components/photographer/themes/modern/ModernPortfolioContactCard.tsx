import Link from 'next/link'
import type { SiteLanguage } from '@/lib/site-language'
import { homepageSectionHref } from '@/lib/photographer-site-paths'
import { getPublicGalleryContactLabel, getPublicGalleryDefaultCta } from '@/lib/public-gallery-copy'
import styles from './ModernPortfolioContactCard.module.css'

export type ModernPortfolioContactCardProps = {
  title: string | null
  description: string | null
  accentColor: string
  /** The portfolio page lives at its own path — this CTA links back to the homepage's contact section. */
  homepagePath: string
  language: SiteLanguage
}

export function ModernPortfolioContactCard({
  title,
  description,
  accentColor,
  homepagePath,
  language,
}: ModernPortfolioContactCardProps) {
  const defaults = getPublicGalleryDefaultCta(language)
  const resolvedTitle = title?.trim() || defaults.title
  const resolvedDescription = description?.trim() || defaults.description
  const buttonLabel = getPublicGalleryContactLabel(language)
  const href = homepageSectionHref(homepagePath, 'contact')

  return (
    <section className={styles.section} style={{ '--cta-accent': accentColor } as React.CSSProperties}>
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
