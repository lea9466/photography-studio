import type { SiteLanguage } from '@/lib/site-language'
import styles from './ClassicPortfolioTabs.module.css'

/** Sentinel filter value meaning "show every gallery" — mirrors `__all__` in the old initPortfolioLazyLoad script. */
export const CLASSIC_PORTFOLIO_ALL_FILTER = '__all__'

export type ClassicPortfolioTabsProps = {
  galleryNames: string[]
  activeFilter: string
  onSelect: (filter: string) => void
  accentColor: string
  language: SiteLanguage
}

export function ClassicPortfolioTabs({
  galleryNames,
  activeFilter,
  onSelect,
  accentColor,
  language,
}: ClassicPortfolioTabsProps) {
  // Matches the old renderer: the tabs only exist once there's more than
  // one gallery to filter by (a single-gallery portfolio has nothing to
  // filter between besides "All").
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
        className={`${styles.tab} ${activeFilter === CLASSIC_PORTFOLIO_ALL_FILTER ? styles.isActive : ''}`}
        onClick={() => onSelect(CLASSIC_PORTFOLIO_ALL_FILTER)}
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
