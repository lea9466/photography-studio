import type { SiteLanguage } from '@/lib/site-language'
import styles from './DarkPortfolioHeader.module.css'

export type DarkPortfolioHeaderProps = {
  pageTitle: string
  /** Optional subtitle line under the title — mirrors `sectionTitle` in PublicPortfolioPageData. */
  sectionTitle?: string | null
  /** Total photo count across all galleries — stays fixed when a tab filter is applied, matching ClassicPortfolioHeader/the old renderer. */
  photoCount: number
  accentColor: string
  language: SiteLanguage
}

function formatPhotoCountLabel(count: number, language: SiteLanguage): string {
  if (language === 'en') return `${count} ${count === 1 ? 'photo' : 'photos'}`
  return `${count} תמונות`
}

/**
 * Dark-theme portfolio page header — 1:1 port of the `dark` branch of
 * portfolioHeader() (lib/public-portfolio-html.ts): a plain uppercase
 * "Portfolio" label (NOT DarkSectionEyebrow's hollow-stroke homepage
 * treatment — confirmed by reading the source, which never calls
 * boldSectionEyebrow() on this page), then the title and photo-count meta.
 * Unlike classic/elegant, dark's header has no divider bar under the title.
 */
export function DarkPortfolioHeader({
  pageTitle,
  sectionTitle,
  photoCount,
  accentColor,
  language,
}: DarkPortfolioHeaderProps) {
  return (
    <header className={styles.header}>
      <span className={styles.eyebrow} style={{ color: accentColor }}>
        Portfolio
      </span>
      <h1 className={styles.title}>{pageTitle}</h1>
      {sectionTitle ? <p className={styles.sectionTitle}>{sectionTitle}</p> : null}
      <p className={styles.meta} style={{ color: accentColor }}>
        {formatPhotoCountLabel(photoCount, language)}
      </p>
    </header>
  )
}
