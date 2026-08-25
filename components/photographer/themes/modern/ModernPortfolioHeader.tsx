import type { SiteLanguage } from '@/lib/site-language'
import { SectionTitle } from '../shared/SectionTitle'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import styles from './ModernPortfolioHeader.module.css'

export type ModernPortfolioHeaderProps = {
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
 * Modern-theme portfolio page header — same info shape as
 * ClassicPortfolioHeader.tsx (title/optional subtitle/divider/photo-count
 * meta) but composed from modern's own eyebrow+SectionTitle pair instead of
 * classic's cursive ClassicSectionScript, matching how every modern homepage
 * section headers itself (see ModernGalleriesSection.tsx).
 */
export function ModernPortfolioHeader({
  pageTitle,
  sectionTitle,
  photoCount,
  accentColor,
  language,
}: ModernPortfolioHeaderProps) {
  return (
    <header className={styles.header} style={{ '--modern-accent': accentColor } as React.CSSProperties}>
      <ModernSectionEyebrow align="center">PORTFOLIO</ModernSectionEyebrow>
      <SectionTitle color="#0f172a" className={styles.title} style={{ textAlign: 'center' }}>
        {pageTitle}
      </SectionTitle>
      {sectionTitle ? <p className={styles.sectionTitle}>{sectionTitle}</p> : null}
      <div className={styles.divider} style={{ backgroundColor: accentColor }} />
      <p className={styles.meta}>{formatPhotoCountLabel(photoCount, language)}</p>
    </header>
  )
}
