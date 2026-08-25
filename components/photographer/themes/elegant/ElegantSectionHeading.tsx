import type { CSSProperties } from 'react'
import { SectionTitle } from '../shared/SectionTitle'
import styles from './ElegantSectionHeading.module.css'

export type ElegantSectionHeadingAlign =
  /** Default: shrink-to-fit block that hugs whichever edge the surrounding
   * flow dictates (right, for RTL Hebrew) — used by the About section. */
  | 'natural'
  /** Flush-left grid stack, title text stays RTL internally — used by the
   * galleries/posts/testimonials/FAQ section headers (a deliberate "docked
   * left" look, see elegant.ts's own "Elegant galleries title: flush left
   * with gallery grid" comment, ELEGANT_HOMEPAGE_POSTS_CSS in
   * lib/homepage-posts-section.ts, and elegantFaqSectionCss()'s shared
   * `.faq-section__header`/`.testimonials-section__header` rule in
   * lib/homepage-themes/shared-styles.ts — all three resolve to the same
   * left-docked, RTL-title layout). Also used by recent-photos as of
   * 2026-08-24, though the real source docks that section's header
   * right/RTL-natural instead — see ElegantRecentPhotosSection.tsx's docblock
   * for why this one is a deliberate deviation from source. */
  | 'start'
  /** Full-width, centered — used by the packages/contact section headers. */
  | 'center'

export type ElegantSectionHeadingProps = {
  title: string
  /** Large uppercase English word stacked behind the title (grid-area 1/1) — "COLLECTIONS", "LATEST", "PACKAGES", "RECOMMEND", "FAQ", "CONTACT", "ABOUT". Always rendered in English/LTR regardless of site language, matching the old renderer's literal watermark strings. */
  watermark: string
  accentColor: string
  align?: ElegantSectionHeadingAlign
  /** Lightens the watermark for the on-dark contact section background. */
  onDark?: boolean
}

/**
 * Elegant theme's section eyebrow — 1:1 port of `elegantSectionHeading()`
 * (lib/homepage-themes/generate-homepage-html.ts): a big, faint uppercase
 * watermark word stacked directly behind the real (translated) section
 * title via CSS grid `grid-area: 1 / 1`, both centered on the same baseline.
 * This is elegant's distinct eyebrow pattern — NOT a reuse of classic's
 * cursive `ClassicSectionScript` label.
 *
 * The title itself reuses the shared `SectionTitle` component — its
 * `var(--headline-font)` clamp() is the exact same typography the old
 * renderer applied via `.elegant-section-heading__title.site-section-title`.
 */
export function ElegantSectionHeading({
  title,
  watermark,
  accentColor,
  align = 'natural',
  onDark = false,
}: ElegantSectionHeadingProps) {
  const classes = [
    styles.heading,
    align === 'center' ? styles.center : '',
    align === 'start' ? styles.start : '',
    onDark ? styles.onDark : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} style={{ '--eh-accent': accentColor } as CSSProperties}>
      <span className={styles.watermark} aria-hidden="true">
        {watermark}
      </span>
      <SectionTitle className={styles.title}>{title}</SectionTitle>
    </div>
  )
}
