import type { SiteLanguage } from '@/lib/site-language'
import {
  ClassicBeforeAfterComparisonSection,
  type ClassicBeforeAfterItem,
} from './ClassicBeforeAfterComparisonSection'
import { getClassicBeforeAfterCopy, type ClassicBeforeAfterDisplayStyle } from './classicBeforeAfterCopy'
import styles from './ClassicBeforeAfterPage.module.css'
import './classic-theme.css'

export type { ClassicBeforeAfterItem, ClassicBeforeAfterDisplayStyle }

export type ClassicBeforeAfterPageProps = {
  accentColor: string
  language: SiteLanguage
  pageTitle: string
  intro: string
  displayStyle: ClassicBeforeAfterDisplayStyle
  items: ClassicBeforeAfterItem[]
}

/**
 * Classic-theme "before / after" page — 1:1 port of
 * `generatePublicBeforeAfterPageHTML` (lib/public-before-after-html.ts) for
 * the classic theme only. Composed the same way ClassicHomePage.tsx is:
 * rendered inside app/dev-preview/classic/layout.tsx, which owns the
 * persistent ClassicSiteHeader/Footer — this component renders only its own
 * `<main>` of real React sections instead of one HTML string handed to an
 * iframe.
 *
 * The old route (app/[slug]/before-after/page.tsx) 404s outright when a
 * studio has zero active comparisons — that's a server/routing concern this
 * component doesn't own, but it still guards against an empty list itself
 * (renders nothing) so a caller can't render a page with no content.
 */
export function ClassicBeforeAfterPage(props: ClassicBeforeAfterPageProps) {
  const { accentColor, language, pageTitle, intro, displayStyle, items } = props

  if (items.length === 0) return null

  const copy = getClassicBeforeAfterCopy(language)
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
            <ClassicBeforeAfterComparisonSection
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
