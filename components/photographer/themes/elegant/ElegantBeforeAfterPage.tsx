import type { SiteLanguage } from '@/lib/site-language'
import {
  ElegantBeforeAfterComparisonSection,
  type ElegantBeforeAfterItem,
} from './ElegantBeforeAfterComparisonSection'
import { getElegantBeforeAfterCopy, type ElegantBeforeAfterDisplayStyle } from './elegantBeforeAfterCopy'
import styles from './ElegantBeforeAfterPage.module.css'
import './elegant-theme.css'

export type { ElegantBeforeAfterItem, ElegantBeforeAfterDisplayStyle }

export type ElegantBeforeAfterPageProps = {
  accentColor: string
  language: SiteLanguage
  pageTitle: string
  intro: string
  displayStyle: ElegantBeforeAfterDisplayStyle
  items: ElegantBeforeAfterItem[]
}

/**
 * Elegant-theme "before / after" page — same composition as
 * Classic/Dark/ModernBeforeAfterPage.tsx (the shared REVEAL_LENS_CSS header
 * markup, including the flourish SVG) wrapping a list of
 * ElegantBeforeAfterComparisonSection pairs. Same empty-list guard: the old
 * route (app/[slug]/before-after/page.tsx) 404s outright when a studio has
 * zero active comparisons — a server/routing concern this component doesn't
 * own, but it still renders nothing itself so a caller can't render a page
 * with no content.
 */
export function ElegantBeforeAfterPage(props: ElegantBeforeAfterPageProps) {
  const { accentColor, language, pageTitle, intro, displayStyle, items } = props

  if (items.length === 0) return null

  const copy = getElegantBeforeAfterCopy(language)
  const headerStyle = { '--ba-accent': accentColor } as React.CSSProperties

  return (
    <>
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
            <ElegantBeforeAfterComparisonSection
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
    </>
  )
}
