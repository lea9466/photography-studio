import type { SiteLanguage } from '@/lib/site-language'
import styles from './ElegantPortfolioTabs.module.css'

/** Sentinel filter value meaning "show every gallery" — mirrors CLASSIC/DARK/MODERN_PORTFOLIO_ALL_FILTER (kept identically named/valued for cross-theme consistency, both feed the same __all__ sentinel the old initPortfolioLazyLoad script used). */
export const ELEGANT_PORTFOLIO_ALL_FILTER = '__all__'

export type ElegantPortfolioTabsProps = {
  galleryNames: string[]
  activeFilter: string
  onSelect: (filter: string) => void
  accentColor: string
  language: SiteLanguage
}

export function ElegantPortfolioTabs({
  galleryNames,
  activeFilter,
  onSelect,
  accentColor,
  language,
}: ElegantPortfolioTabsProps) {
  // Matches Classic/Dark/ModernPortfolioTabs/the old renderer: no tabs at all
  // when there's nothing to filter between besides "All".
  if (galleryNames.length === 0) return null

  const allLabel = language === 'en' ? 'All' : 'הכל'
  const navLabel = language === 'en' ? 'Galleries' : 'גלריות'
  const accentStyle = {
    '--tab-accent': accentColor,
    '--tab-border-accent': `${accentColor}66`,
  } as React.CSSProperties

  return (
    <nav className={styles.tabs} style={accentStyle} aria-label={navLabel}>
      <button
        type="button"
        className={`${styles.tab} ${activeFilter === ELEGANT_PORTFOLIO_ALL_FILTER ? styles.isActive : ''}`}
        onClick={() => onSelect(ELEGANT_PORTFOLIO_ALL_FILTER)}
      >
        {allLabel}
      </button>
      {galleryNames.map((name) => (
        <button
          key={name}
          type="button"
          className={`${styles.tab} ${activeFilter === name ? styles.isActive : ''}`}
          onClick={() => onSelect(name)}
        >
          {name}
        </button>
      ))}
    </nav>
  )
}
