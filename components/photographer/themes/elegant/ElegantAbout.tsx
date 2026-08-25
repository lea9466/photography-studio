'use client'

import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ElegantSectionHeading } from './ElegantSectionHeading'
import styles from './ElegantAbout.module.css'

export type ElegantAboutProps = {
  title: string | null
  subtitle: string | null
  description: string | null
  accentColor: string
  imageUrl: string | null
  statsClients: number
  statsProjects: number
  statsYears: number
  /** Same-page anchor the "view galleries" button scrolls to. */
  galleryAnchorHref: string
  language: SiteLanguage
}

const formatStat = (value: number) => (value > 0 ? `${value}+` : `${value}`)

/**
 * Elegant's own reveal-on-scroll options (`{ threshold: 0.15, rootMargin:
 * '0px 0px -50px 0px' }`, lib/homepage-themes/elegant.ts's inline observer) —
 * different from HOMEPAGE_REVEAL_INIT_SCRIPT's defaults classic-theme
 * sections fall back to.
 */
const ELEGANT_REVEAL_OPTIONS = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }

/**
 * Elegant's stats banner + About section — 1:1 port of the two adjoining
 * (but structurally SEPARATE) `<section>`s in
 * lib/homepage-themes/elegant.ts: a stats grid that renders unconditionally
 * whenever any stat is set, immediately followed by the About copy/image
 * section. Kept in one component (rather than split into
 * ElegantStats/ElegantAbout) since they're one adjoining unit in the source
 * and neither has an id of its own besides About's `#about`.
 */
export function ElegantAbout(props: ElegantAboutProps) {
  const {
    title,
    subtitle,
    description,
    accentColor,
    imageUrl,
    statsClients,
    statsProjects,
    statsYears,
    galleryAnchorHref,
    language,
  } = props

  const copy = getHomepageCopy(language)
  const hasStats = statsProjects > 0 || statsClients > 0 || statsYears > 0
  const hasAbout = Boolean(title || subtitle || description)

  const { ref: statsRef, revealed: statsRevealed } = useRevealOnScroll<HTMLElement>(ELEGANT_REVEAL_OPTIONS)
  const { ref: aboutRef, revealed: aboutRevealed } = useRevealOnScroll<HTMLElement>(ELEGANT_REVEAL_OPTIONS)

  if (!hasStats && !hasAbout) return null

  return (
    <>
      {hasStats ? (
        <section
          ref={statsRef}
          className={`${styles.stats} reveal-on-scroll ${statsRevealed ? 'active' : ''}`}
        >
          <div className={styles.stat}>
            <span className={styles.statNumber} style={{ color: accentColor }}>
              {formatStat(statsYears)}
            </span>
            <span className={styles.statLabel}>{copy.stats.yearsExperience}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber} style={{ color: accentColor }}>
              {formatStat(statsClients)}
            </span>
            <span className={styles.statLabel}>{copy.stats.happyClients}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber} style={{ color: accentColor }}>
              {formatStat(statsProjects)}
            </span>
            <span className={styles.statLabel}>{copy.stats.portfolios}</span>
          </div>
        </section>
      ) : null}

      {hasAbout ? (
        <section
          ref={aboutRef}
          id="about"
          className={`${styles.section} reveal-on-scroll ${aboutRevealed ? 'active' : ''}`}
        >
          <div
            aria-hidden="true"
            className={styles.glow}
            style={{
              background: `linear-gradient(to right, color-mix(in srgb, ${accentColor} 30%, transparent), transparent)`,
            }}
          />
          <div className={styles.grid}>
            <div className={`${styles.copy} order-2 lg:order-1`}>
              <span className={styles.label} style={{ color: accentColor }}>
                {copy.about.label}
              </span>
              {title ? (
                <ElegantSectionHeading title={title} watermark="ABOUT" accentColor={accentColor} />
              ) : null}
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
              {description ? <p className={styles.description}>{description}</p> : null}
              <a href={galleryAnchorHref} className={styles.cta}>
                {copy.hero.viewGalleries}
              </a>
            </div>
            <div className={`${styles.imageWrap} image-reveal order-1 lg:order-2`}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={copy.misc.portraitAlt} className={styles.image} src={imageUrl} />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
