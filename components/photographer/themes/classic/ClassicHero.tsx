'use client'

import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ClassicHeroBackground } from './ClassicHeroBackground'
import styles from './ClassicHero.module.css'

export type ClassicHeroProps = {
  studioName: string
  photographerName: string
  /** Plain text (already trimmed of markup) — rendered as JSX text, so React escapes it automatically. */
  aboutText: string | null
  accentColor: string
  desktopImages: string[]
  mobileImages: string[]
  heroVideoUrl?: string | null
  /** Same-page anchor, e.g. "#galleries" or "#recent-photos" — the hero only ever renders on the homepage. */
  galleryAnchorHref: string
  contactAnchorHref?: string
  language: SiteLanguage
}

export function ClassicHero(props: ClassicHeroProps) {
  const {
    studioName,
    photographerName,
    aboutText,
    accentColor,
    desktopImages,
    mobileImages,
    heroVideoUrl,
    galleryAnchorHref,
    contactAnchorHref = '#contact',
    language,
  } = props

  const copy = getHomepageCopy(language)
  // Only the studio's own about_text — no canned default. Empty ⇒ no paragraph.
  const bodyText = aboutText?.trim()

  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  return (
    <section
      ref={ref}
      id="hero"
      className={`reveal ${revealed ? 'active' : ''} relative flex h-screen w-full items-end justify-start overflow-hidden`}
      style={{ '--hero-accent': accentColor } as React.CSSProperties}
    >
      <div className="absolute inset-0 z-0 scale-105">
        <ClassicHeroBackground
          desktopImages={desktopImages}
          mobileImages={mobileImages}
          videoUrl={heroVideoUrl}
          alt={studioName || copy.misc.photographyAlt}
        />
      </div>

      <div className="pointer-events-none absolute top-1/2 left-8 z-20 hidden -translate-y-1/2 lg:block">
        <div className={`${styles.verticalTextLabel} whitespace-nowrap`}>
          {studioName} · {photographerName}
        </div>
      </div>

      <div className={styles.heroGlassContainer}>
        <div className={`${styles.glassCardFrame} w-full max-w-[450px] shrink-0`}>
          <div
            className={`${styles.glassCard} ${styles.glassCardFloat} ${styles.heroGlassCard} box-border w-full max-w-[450px] px-3 pt-5 pb-5 lg:m-5 lg:mt-[calc(1.25rem+10px)] lg:w-[450px] lg:px-6 lg:pt-[21px] lg:pb-[27px]`}
          >
            <div className={styles.heroGlassInner}>
              <div className={`${styles.heroGlassCopy} h-auto`}>
                <span className={styles.eyebrow}>{studioName}</span>
                <h1 className={styles.title}>
                  {photographerName} | {copy.hero.photographySuffix}
                </h1>
                {bodyText ? <p className={styles.body}>{bodyText}</p> : null}
              </div>
              <div className={styles.heroGlassActions}>
                {/* Plain same-page anchors instead of a querySelector+scrollIntoView
                    click handler — the browser's native anchor scrolling (smoothed by
                    `scroll-behavior: smooth`, set at the theme layout level) does this
                    declaratively, without reaching into the DOM imperatively. */}
                <a href={contactAnchorHref} className={styles.ctaPrimary}>
                  {copy.hero.scheduleSession}
                </a>
                <a href={galleryAnchorHref} className={styles.ctaSecondary}>
                  {copy.hero.viewGalleries}
                </a>
              </div>
            </div>
          </div>
          <span aria-hidden="true" className={`${styles.glassCardAccentLine} hidden lg:block`} />
        </div>
      </div>
    </section>
  )
}
