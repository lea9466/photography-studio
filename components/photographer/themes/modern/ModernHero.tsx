'use client'

import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { ModernHeroBackground } from './ModernHeroBackground'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { useMountedReveal } from './useMountedReveal'
import styles from './ModernHero.module.css'

export type ModernHeroProps = {
  /** Overrides the default two-line hollow title (line 2 is accent-stroked) — matches aboutTitle in the old renderer. */
  title: string | null
  subtitle: string | null
  description: string | null
  accentColor: string
  desktopImages: string[]
  mobileImages: string[]
  heroVideoUrl?: string | null
  /** Same-page anchor the "view gallery" CTA scrolls to — "#portfolio" (separated mode) or "#recent-photos" (portfolio mode), mirrors heroGalleryAnchor's modern branch in lib/homepage-themes/generate-homepage-html.ts. */
  galleryAnchorHref: string
  contactAnchorHref?: string
  language: SiteLanguage
}

/**
 * Modern theme's hero — unlike classic (a short slideshow hero followed by a
 * separate About section with photographer photo/stats), the old renderer
 * literally merges hero + about into one `<section id="about">`: a
 * min-h-screen film-belt background behind a hollow-stroke title, muted
 * subtitle/description, and the "get started"/"view gallery" CTAs. Ported
 * here as ModernHero; the separate stats-cards strip below it is
 * ModernAbout.tsx (modern has no photographer-portrait/quote card — those
 * stats cards are all "about" is otherwise).
 */
export function ModernHero(props: ModernHeroProps) {
  const {
    title,
    subtitle,
    description,
    accentColor,
    desktopImages,
    mobileImages,
    heroVideoUrl,
    galleryAnchorHref,
    contactAnchorHref = '#contact',
    language,
  } = props

  const copy = getHomepageCopy(language)
  // "animate-reveal"/"delay-*"/"is-mounted" are global classes defined in
  // ./modern-theme.css (the theme's shared root stylesheet, scoped under
  // .theme-modern) — same pattern as classic's `reveal`/`active` classes
  // from classic-theme.css, referenced by plain string here rather than via
  // CSS modules since they're shared across every modern section, not local
  // to this one component.
  const mounted = useMountedReveal()
  const reveal = (extra = '') => `animate-reveal ${extra} ${mounted ? 'is-mounted' : ''}`.trim()

  return (
    <section
      id="about"
      className={styles.section}
      style={{ '--modern-accent': accentColor } as React.CSSProperties}
    >
      <div className={styles.bg}>
        <ModernHeroBackground
          desktopImages={desktopImages}
          mobileImages={mobileImages}
          videoUrl={heroVideoUrl}
          alt={copy.misc.photographyAlt}
        />
      </div>

      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={reveal(styles.copy)}>
            <ModernSectionEyebrow align="right">ABOUT</ModernSectionEyebrow>
            {title ? (
              <h1 className={styles.title}>{title}</h1>
            ) : (
              <h1 className={styles.title}>
                {copy.about.modernDefaultTitleLine1}
                <br />
                <span className={styles.titleAccent}>{copy.about.modernDefaultTitleLine2}</span>
              </h1>
            )}
            {subtitle ? <p className={styles.body}>{subtitle}</p> : null}
            {description ? <p className={styles.body}>{description}</p> : null}

            <div className={reveal(`${styles.actions} delay-200`)}>
              <a href={contactAnchorHref} className={styles.ctaPrimary}>
                {copy.hero.getStarted}
              </a>
              <a href={galleryAnchorHref} className={styles.ctaSecondary}>
                {copy.hero.viewGallery}
              </a>
            </div>
          </div>
          <div className={styles.spacer} aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
