'use client'

import type { CSSProperties } from 'react'
import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ElegantHeroBackground } from './ElegantHeroBackground'
import styles from './ElegantHero.module.css'

export type ElegantHeroProps = {
  studioName: string
  /** Plain text (already trimmed of markup) — rendered as JSX text, so React escapes it automatically. */
  aboutText: string | null
  accentColor: string
  desktopImages: string[]
  mobileImages: string[]
  heroVideoUrl?: string | null
  /** Same-page anchor, e.g. "#gallery" or "#recent-photos" — the hero only ever renders on the homepage. */
  galleryAnchorHref: string
  language: SiteLanguage
}

/**
 * Splits the studio name into up to two lines, coloring only the LAST word
 * with the accent color — the React equivalent of the old renderer's
 * glassHeroTitle() (lib/homepage-themes/text-helpers.ts), which built an HTML
 * string. Doing it as JSX text nodes means no HTML injection is needed.
 */
function GlassHeroTitle({ text }: { text: string }) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const words = trimmed.split(/\s+/)
  const lastIndex = words.length - 1

  const renderWords = (chunk: string[], offset: number) =>
    chunk.map((word, index) => (
      <span key={offset + index}>
        {offset + index > 0 ? ' ' : ''}
        {offset + index === lastIndex ? <span className={styles.accentWord}>{word}</span> : word}
      </span>
    ))

  if (words.length <= 2) {
    return <span className={styles.titleLine}>{renderWords(words, 0)}</span>
  }

  return (
    <>
      <span className={styles.titleLine}>{renderWords(words.slice(0, 2), 0)}</span>
      <span className={styles.titleLine}>{renderWords(words.slice(2), 2)}</span>
    </>
  )
}

export function ElegantHero(props: ElegantHeroProps) {
  const { studioName, aboutText, accentColor, desktopImages, mobileImages, heroVideoUrl, galleryAnchorHref, language } =
    props

  const copy = getHomepageCopy(language)
  // Only the studio's own about_text — no canned default. Empty ⇒ no paragraph.
  const bodyText = aboutText?.trim()

  // Elegant's own inline observer (lib/homepage-themes/elegant.ts) uses
  // { threshold: 0.15, rootMargin: '0px 0px -50px 0px' } — different from the
  // classic-theme HOMEPAGE_REVEAL_INIT_SCRIPT defaults useRevealOnScroll()
  // otherwise falls back to — passed explicitly here to match.
  const { ref, revealed } = useRevealOnScroll<HTMLElement>({ threshold: 0.15, rootMargin: '0px 0px -50px 0px' })

  return (
    <section
      ref={ref}
      id="hero"
      className={`${styles.hero} reveal-on-scroll ${revealed ? 'active' : ''}`}
      style={{ '--hero-accent': accentColor } as CSSProperties}
    >
      {/* Two nested divs, not one — `.image-reveal` (elegant-theme.css) sets
          its own `position: relative`, which at the SAME specificity as
          source's bare `.image-reveal` rule loses to a plain `.absolute`
          utility in the old cascade (Tailwind loads after that inline
          <style> block there) but WINS here: `.theme-elegant .image-reveal`
          (two classes, needed to scope the shared theme CSS file) has higher
          specificity than Tailwind's single-class `.absolute`, so it silently
          overrode `position:absolute` on this element — collapsing it to a
          zero-width flex item (`.hero` is `display:flex`) instead of a
          full-bleed positioned layer, so the hero image/video never had any
          space to render into. Splitting the positioning (`absolute inset-0
          z-0`, no `.image-reveal`) from the reveal effect (`.image-reveal
          active`, now safely `position:relative` on an inner div that just
          needs to fill its parent via w-full/h-full, not `inset`) avoids the
          clash entirely. */}
      <div className="absolute inset-0 z-0">
        <div className={`h-full w-full image-reveal ${revealed ? 'active' : ''}`}>
          <ElegantHeroBackground
            desktopImages={desktopImages}
            mobileImages={mobileImages}
            videoUrl={heroVideoUrl}
            alt={studioName || copy.misc.photographyAlt}
          />
        </div>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.card}>
          <span className={styles.glowBar} aria-hidden="true" />
          <h1 className={styles.title}>
            <GlassHeroTitle text={studioName} />
          </h1>
          {bodyText ? <p className={styles.text}>{bodyText}</p> : null}
          <div className="flex justify-center">
            {/* Same-page anchor instead of a querySelector+scrollIntoView click
                handler — the browser's native anchor scrolling (smoothed by
                `scroll-behavior: smooth`, set at the theme layout level) does
                this declaratively. */}
            <a href={galleryAnchorHref} className={styles.cta}>
              {copy.hero.viewGalleries}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
