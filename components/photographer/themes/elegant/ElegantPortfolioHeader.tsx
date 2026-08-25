import type { SiteLanguage } from '@/lib/site-language'
import styles from './ElegantPortfolioHeader.module.css'

export type ElegantPortfolioHeaderProps = {
  pageTitle: string
  /** Optional subtitle line under the title — mirrors `sectionTitle` in PublicPortfolioPageData. */
  sectionTitle?: string | null
  /** Total photo count across all galleries — stays fixed when a tab filter is applied, matching Classic/Dark/ModernPortfolioHeader and the old renderer. */
  photoCount: number
  accentColor: string
  language: SiteLanguage
}

function formatPhotoCountLabel(count: number, language: SiteLanguage): string {
  if (language === 'en') return `${count} ${count === 1 ? 'photo' : 'photos'}`
  return `${count} תמונות`
}

/**
 * Elegant-theme portfolio page header — 1:1 port of the `elegant` branch of
 * portfolioHeader() (lib/public-portfolio-html.ts): a "Portfolio" eyebrow
 * (always literal English, matching the old renderer's hardcoded string),
 * an h1 in Frank Ruhl Libre (see ElegantPortfolioHeader.module.css's doc
 * comment for why that's NOT the same font as the homepage's section
 * titles), a divider bar under the title (elegant DOES render one here,
 * unlike DarkPortfolioHeader), and an accent-colored photo-count line.
 */
export function ElegantPortfolioHeader({
  pageTitle,
  sectionTitle,
  photoCount,
  accentColor,
  language,
}: ElegantPortfolioHeaderProps) {
  return (
    <header className={styles.header}>
      <span className={styles.eyebrow} style={{ color: accentColor }}>
        Portfolio
      </span>
      <h1 className={styles.title}>{pageTitle}</h1>
      {sectionTitle ? <p className={styles.sectionTitle}>{sectionTitle}</p> : null}
      <div className={styles.divider} style={{ backgroundColor: accentColor }} />
      <p className={styles.meta} style={{ color: accentColor }}>
        {formatPhotoCountLabel(photoCount, language)}
      </p>
    </header>
  )
}
