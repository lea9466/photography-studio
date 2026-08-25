'use client'

import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useMountedReveal } from './useMountedReveal'
import styles from './ModernAbout.module.css'

export type ModernAboutProps = {
  accentColor: string
  statsClients: number
  statsProjects: number
  statsYears: number
  language: SiteLanguage
}

const formatStat = (value: number) => (value > 0 ? `${value}+` : `${value}`)

/**
 * Modern-theme "about" content is really just three stat cards
 * (`.modern-stats-section` in lib/homepage-themes/modern.ts) — the
 * photographer photo/quote/title/description that classic's ClassicAbout
 * shows live inside ModernHero.tsx instead (the old renderer literally
 * merges hero+about into one full-screen section there). This component
 * only exists once at least one stat is actually set, matching the old
 * renderer's `hasStats` guard.
 */
export function ModernAbout({ accentColor, statsClients, statsProjects, statsYears, language }: ModernAboutProps) {
  const hasStats = statsProjects > 0 || statsClients > 0 || statsYears > 0
  if (!hasStats) return null

  const copy = getHomepageCopy(language)
  const mounted = useMountedReveal()
  const reveal = (extra = '') => `animate-reveal ${extra} ${mounted ? 'is-mounted' : ''}`.trim()

  const cards = [
    { icon: 'photo_camera', value: statsProjects, label: copy.stats.portfolios, delay: '' },
    { icon: 'groups', value: statsClients, label: copy.stats.happyClients, delay: 'delay-100' },
    { icon: 'military_tech', value: statsYears, label: copy.stats.yearsExperience, delay: 'delay-200' },
  ]

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} className={`${styles.card} ${reveal(card.delay)}`}>
            {/* material-symbols-outlined is the same global icon-font class the
                old markup used — font loading is a layout-level concern, not
                something this component owns (see ClassicPackageCard.tsx's
                identical note). */}
            <span
              className={`material-symbols-outlined ${styles.icon}`}
              aria-hidden="true"
              style={{ color: accentColor }}
            >
              {card.icon}
            </span>
            <h3 className={styles.value}>{formatStat(card.value)}</h3>
            <p className={styles.label}>{card.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
