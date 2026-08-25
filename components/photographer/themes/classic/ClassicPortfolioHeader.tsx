import type { SiteLanguage } from '@/lib/site-language'
import { ClassicSectionScript } from './ClassicSectionScript'
import styles from './ClassicPortfolioHeader.module.css'

export type ClassicPortfolioHeaderProps = {
  pageTitle: string
  /** Optional subtitle line under the h1 — mirrors `sectionTitle` in PublicPortfolioPageData. */
  sectionTitle?: string | null
  /** Total photo count across all galleries — stays fixed when a tab filter is applied, matching the old renderer (the header is rendered once server-side; only the grid below re-filters client-side). */
  photoCount: number
  accentColor: string
  language: SiteLanguage
}

function formatPhotoCountLabel(count: number, language: SiteLanguage): string {
  if (language === 'en') return `${count} ${count === 1 ? 'photo' : 'photos'}`
  return `${count} תמונות`
}

export function ClassicPortfolioHeader({
  pageTitle,
  sectionTitle,
  photoCount,
  accentColor,
  language,
}: ClassicPortfolioHeaderProps) {
  return (
    <header className={styles.header}>
      <ClassicSectionScript color={accentColor}>Portfolio</ClassicSectionScript>
      <h1 className={styles.title}>{pageTitle}</h1>
      {sectionTitle ? <p className={styles.sectionTitle}>{sectionTitle}</p> : null}
      <div className={styles.divider} style={{ backgroundColor: accentColor }} />
      <p className={styles.meta}>{formatPhotoCountLabel(photoCount, language)}</p>
    </header>
  )
}
