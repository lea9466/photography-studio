'use client'

import { useEffect, useState } from 'react'
import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ModernAbout.module.css'

export type ModernAboutProps = {
  /** aboutDescription, not aboutText — mirrors classic/dark/elegant's
   * separate About section, which shows the fuller about_description body
   * (ModernHero carries the short about_text blurb instead). */
  text: string | null
  imageUrl: string | null
  accentColor: string
  statsClients: number
  statsProjects: number
  statsYears: number
  language: SiteLanguage
}

const formatStat = (value: number) => `${value}+`

const COUNT_UP_MS = 1400
// Matches the chips' fade-in delay in ModernAbout.module.css (.stat).
const COUNT_UP_DELAY_MS = 550

/** Counts from 0 to `value` once `start` flips; renders the final value until then (SSR/no-JS). */
function useCountUp(value: number, start: boolean) {
  const [shown, setShown] = useState(value)

  useEffect(() => {
    if (!start || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setShown(0)
    let frame = 0
    let begin = 0
    const timeout = setTimeout(() => {
      const tick = (now: number) => {
        if (!begin) begin = now
        const progress = Math.min((now - begin) / COUNT_UP_MS, 1)
        setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, COUNT_UP_DELAY_MS)
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frame)
    }
  }, [value, start])

  return shown
}

function StatValue({ value, start }: { value: number; start: boolean }) {
  return <span className={styles.statValue}>{formatStat(useCountUp(value, start))}</span>
}

/**
 * Modern-theme About section ("overlapping card", option C in
 * docs/design-options/modern-about-options.html): a wide rounded photo with a
 * white card riding over its inner edge, holding the about_description text
 * and the stats as accent-tinted chips. Replaces the old pair of
 * ModernAboutStatement (viewfinder-framed portrait + text) and the three
 * big-icon stat cards. Renders nothing when there's neither text nor a stat;
 * a missing photo falls back to an accent-tinted placeholder so the layout
 * never collapses to a lone card.
 *
 * Entrance (on scroll into view): the photo wipes up, the card rises over
 * it, its corner brackets draw in, then the stat chips fade in one by one
 * while their numbers count up.
 */
export function ModernAbout({
  text,
  imageUrl,
  accentColor,
  statsClients,
  statsProjects,
  statsYears,
  language,
}: ModernAboutProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>({ threshold: 0.2 })
  const copy = getHomepageCopy(language)
  const trimmed = text?.trim()

  // Zero stats are hidden individually (the old cards printed a bare "0").
  const stats = [
    { value: statsClients, label: copy.stats.happyClients },
    { value: statsProjects, label: copy.stats.portfolios },
    { value: statsYears, label: copy.stats.yearsExperience },
  ].filter((stat) => stat.value > 0)

  if (!trimmed && stats.length === 0) return null

  return (
    <section
      ref={ref}
      className={`${styles.section} ${revealed ? styles.revealed : ''}`}
      style={{ '--modern-accent': accentColor } as React.CSSProperties}
    >
      <div className={styles.inner}>
        <div className={styles.photo}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={copy.misc.photographerPortraitAlt} className={styles.image} />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <span className="material-symbols-outlined">photo_camera</span>
            </div>
          )}
        </div>

        <div className={styles.card}>
          {/* Rounded accent brackets in the card's four corners. */}
          <span className={`${styles.corner} ${styles.cornerTl}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.cornerTr}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.cornerBl}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.cornerBr}`} aria-hidden="true" />
          <ModernSectionEyebrow align="right">OUR STORY</ModernSectionEyebrow>
          {trimmed ? <p className={styles.text}>{trimmed}</p> : null}
          {stats.length > 0 ? (
            <div className={styles.stats} style={{ '--stat-count': stats.length } as React.CSSProperties}>
              {stats.map((stat, index) => (
                <div key={stat.label} className={styles.stat} style={{ '--stat-index': index } as React.CSSProperties}>
                  <StatValue value={stat.value} start={revealed} />
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
