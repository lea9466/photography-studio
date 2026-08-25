import styles from './DarkSectionEyebrow.module.css'

export type DarkSectionEyebrowAlign = 'left' | 'center' | 'right'

export type DarkSectionEyebrowProps = {
  children: string
  accentColor: string
  align?: DarkSectionEyebrowAlign
}

const ALIGN_CLASS: Record<DarkSectionEyebrowAlign, string> = {
  left: '',
  center: styles.wrapCenter,
  right: styles.wrapRight,
}

/**
 * Dark theme's homepage section eyebrow — 1:1 port of `boldSectionEyebrow()`
 * in lib/homepage-themes/generate-homepage-html.ts: an uppercase Bebas Neue
 * label with a hollow (stroke-only, no fill) look via -webkit-text-stroke,
 * skewed slightly for the "bold/editorial" feel. Distinct from classic's
 * cursive `ClassicSectionScript` — do not reuse that component here.
 *
 * Only used on the HOMEPAGE sections (hero/about/gallery/packages/
 * testimonials/faq/contact) — the standalone portfolio/blog/before-after
 * pages use a much plainer uppercase label instead (see
 * DarkPortfolioHeader.tsx / DarkBlogListPage.tsx / DarkBeforeAfterPage.tsx),
 * confirmed by reading lib/public-portfolio-html.ts, lib/public-blog-html.ts
 * and lib/public-before-after-html.ts — none of them call
 * `boldSectionEyebrow()`.
 */
export function DarkSectionEyebrow({ children, accentColor, align = 'left' }: DarkSectionEyebrowProps) {
  return (
    <div className={`${styles.wrap} ${ALIGN_CLASS[align]}`}>
      <span className={styles.eyebrow} aria-hidden="true" style={{ '--eyebrow-accent': accentColor } as React.CSSProperties}>
        {children}
      </span>
    </div>
  )
}
