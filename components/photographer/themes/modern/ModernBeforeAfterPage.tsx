import type { SiteLanguage } from '@/lib/site-language'
import {
  ModernBeforeAfterComparisonSection,
  type ModernBeforeAfterItem,
} from './ModernBeforeAfterComparisonSection'
import { getModernBeforeAfterCopy, type ModernBeforeAfterDisplayStyle } from './modernBeforeAfterCopy'
import styles from './ModernBeforeAfterPage.module.css'
import './modern-theme.css'

export type { ModernBeforeAfterItem, ModernBeforeAfterDisplayStyle }

export type ModernBeforeAfterPageProps = {
  /** studioName/logoUrl/shouldColorLogo/homepagePath/beforeAfterPath/blogPath/
   * portfolioPath/galleryLayoutMode/hasFaq/hasPackages/hasBlog were
   * header/footer-only and moved to the shared
   * app/dev-preview/modern/layout.tsx that now renders ModernSiteHeader/
   * ModernSiteFooter around this page. */
  accentColor: string
  language: SiteLanguage
  pageTitle: string
  intro: string
  displayStyle: ModernBeforeAfterDisplayStyle
  items: ModernBeforeAfterItem[]
}

/**
 * Modern-theme "before / after" page — same composition as
 * ClassicBeforeAfterPage.tsx (the shared REVEAL_LENS_CSS header markup,
 * including the flourish SVG — see ModernBeforeAfterPage.module.css's doc
 * comment for why that's ported here too, not omitted) wrapping a list of
 * ModernBeforeAfterComparisonSection pairs. Same empty-list guard: the old
 * route 404s outright when a studio has zero active comparisons (a
 * server/routing concern this component doesn't own), but it still renders
 * nothing itself so a caller can't render a page with no content.
 */
export function ModernBeforeAfterPage(props: ModernBeforeAfterPageProps) {
  const {
    accentColor,
    language,
    pageTitle,
    intro,
    displayStyle,
    items,
  } = props

  if (items.length === 0) return null

  const copy = getModernBeforeAfterCopy(language)
  const headerStyle = { '--ba-accent': accentColor } as React.CSSProperties

  return (
    <main className={styles.page}>
      <header className={styles.header} style={headerStyle}>
        <span className={styles.eyebrow}>{copy.eyebrow}</span>
        <h1 className={styles.title}>{pageTitle}</h1>
        <svg
          className={styles.flourish}
          viewBox="0 0 220 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6 12 C 34 3, 58 18, 86 9 C 112 1, 132 17, 158 8 C 178 1, 194 14, 206 10 C 212 8, 214 6, 216 5" />
        </svg>
        <p className={styles.intro}>{intro}</p>
      </header>

      <div className={styles.list}>
        {items.map((item, index) => (
          <ModernBeforeAfterComparisonSection
            key={item.id}
            item={item}
            index={index}
            language={language}
            accentColor={accentColor}
            displayStyle={displayStyle}
          />
        ))}
      </div>
    </main>
  )
}
