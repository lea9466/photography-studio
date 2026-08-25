'use client'

import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ClassicSectionScript } from './ClassicSectionScript'
import styles from './ClassicAbout.module.css'

export type ClassicAboutProps = {
  title: string | null
  subtitle: string | null
  description: string | null
  accentColor: string
  photographerName: string
  imageUrl: string | null
  statsClients: number
  statsProjects: number
  statsYears: number
  language: SiteLanguage
}

const formatStat = (value: number) => (value > 0 ? `${value}+` : `${value}`)

/** Splits the title into plain words, underlining only the last one — the
 * React equivalent of the old renderer's underlineLastWord(), which built an
 * HTML string. Doing it as an array of text nodes instead means no HTML
 * injection is needed at all. */
function TitleWithUnderline({ text }: { text: string }) {
  const words = text.trim().split(/\s+/)
  if (words.length <= 1) {
    return <span className={styles.titleUnderline}>{text.trim()}</span>
  }
  const lastWord = words.pop()
  return (
    <>
      {words.join(' ')} <span className={styles.titleUnderline}>{lastWord}</span>
    </>
  )
}

export function ClassicAbout(props: ClassicAboutProps) {
  const {
    title,
    subtitle,
    description,
    accentColor,
    photographerName,
    imageUrl,
    statsClients,
    statsProjects,
    statsYears,
    language,
  } = props

  // Matches the old renderer: the whole section only exists once the studio
  // has actually filled in about content.
  if (!title && !subtitle && !description) return null

  const copy = getHomepageCopy(language)
  const hasStats = statsProjects > 0 || statsClients > 0 || statsYears > 0
  const glowStyle = { '--about-accent': accentColor } as React.CSSProperties
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  return (
    <section
      ref={ref}
      id="about"
      className={`reveal ${revealed ? 'active' : ''} relative w-full overflow-hidden py-20`}
      style={glowStyle}
    >
      <div
        aria-hidden="true"
        className={`${styles.glow} ${styles.glowLeft}`}
        style={{
          background: `radial-gradient(circle, ${accentColor}70 0%, ${accentColor}45 24%, ${accentColor}22 46%, transparent 72%)`,
        }}
      />
      <div
        aria-hidden="true"
        className={`${styles.glow} ${styles.glowRight}`}
        style={{
          background: `radial-gradient(circle, ${accentColor}80 0%, ${accentColor}50 26%, ${accentColor}28 48%, transparent 74%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
          <div className="order-1 max-w-2xl space-y-8 text-start rtl:text-right md:pr-8">
            <ClassicSectionScript color={accentColor}>About</ClassicSectionScript>
            <h2 className={styles.title}>
              <TitleWithUnderline text={title || copy.about.defaultTitle} />
            </h2>
            <div className="space-y-6">
              {subtitle ? <p className={styles.bodyPrimary}>{subtitle}</p> : null}
              {description ? <p className={styles.bodySecondary}>{description}</p> : null}
            </div>
            {hasStats ? (
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-[#d1c6b4]/15 pt-10 md:gap-6">
                <div className="text-start rtl:text-right">
                  <div className={styles.statNumber}>{formatStat(statsClients)}</div>
                  <div className={styles.statLabel}>{copy.stats.happyClients}</div>
                </div>
                <div className="text-start rtl:text-right">
                  <div className={styles.statNumber}>{formatStat(statsProjects)}</div>
                  <div className={styles.statLabel}>{copy.stats.portfolios}</div>
                </div>
                <div className="text-start rtl:text-right">
                  <div className={styles.statNumber}>{formatStat(statsYears)}</div>
                  <div className={styles.statLabel}>{copy.stats.yearsExperience}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="order-2 relative">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={copy.misc.photographerPortraitAlt}
                className="aspect-[4/5] w-full object-cover md:aspect-[3/4]"
                src={imageUrl}
              />
            ) : null}
            <div className={`${styles.imageQuote} absolute -bottom-8 -left-6 hidden max-w-[260px] md:-bottom-10 md:-left-10 md:block`}>
              <div className={styles.imageQuoteLine} />
              <p className={styles.imageQuoteName}>— {photographerName}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
