'use client'

import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { DarkBrandLastWord } from './DarkBrandLastWord'
import { DarkHeroBackground } from './DarkHeroBackground'
import styles from './DarkHero.module.css'

export type DarkHeroProps = {
  studioName: string
  /** Plain text — rendered as JSX text, React escapes it automatically. */
  aboutText: string | null
  accentColor: string
  desktopImages: string[]
  mobileImages: string[]
  heroVideoUrl?: string | null
  /** Same-page anchor, e.g. "#gallery" — the hero only ever renders on the homepage. */
  galleryAnchorHref: string
  language: SiteLanguage
}

export function DarkHero(props: DarkHeroProps) {
  const { studioName, aboutText, accentColor, desktopImages, mobileImages, heroVideoUrl, galleryAnchorHref, language } =
    props

  const copy = getHomepageCopy(language)
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  return (
    <section
      ref={ref}
      id="hero"
      className={`reveal ${revealed ? 'active' : ''} relative flex h-screen w-full items-end overflow-hidden`}
      style={{ '--hero-accent': accentColor } as React.CSSProperties}
    >
      <div className="absolute inset-0 z-0">
        <DarkHeroBackground
          desktopImages={desktopImages}
          mobileImages={mobileImages}
          videoUrl={heroVideoUrl}
          alt={studioName || copy.misc.photographyAlt}
        />
        <div className={`${styles.overlay} absolute inset-0`} />
        <div className={styles.bottomMerge} />
      </div>

      <div className={styles.content}>
        <span className={styles.label} style={{ color: accentColor }}>
          {copy.hero.premiumStudio}
        </span>
        <h1 className={styles.title}>
          <DarkBrandLastWord text={studioName} accentColor={accentColor} bold />
        </h1>
        {aboutText ? <p className={styles.about}>{aboutText}</p> : null}
        <div className={styles.actions}>
          <a href={galleryAnchorHref} className={styles.btnGallery}>
            {copy.hero.viewGalleryShort}
          </a>
          <a href="#about" className={styles.btnStory}>
            {copy.hero.ourStory}
          </a>
        </div>
      </div>
    </section>
  )
}
