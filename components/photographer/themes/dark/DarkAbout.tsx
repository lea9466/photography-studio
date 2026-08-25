'use client'

import { getHomepageCopy } from '@/lib/homepage-copy'
import { hexToRgb } from '@/lib/homepage-themes/text-helpers'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { DarkSectionEyebrow } from './DarkSectionEyebrow'
import styles from './DarkAbout.module.css'

export type DarkAboutProps = {
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

/** Dark's title is entirely hollow/stroke-only (no fill color at all), so
 * unlike classic's underline-the-last-word treatment there's nothing extra
 * to apply to the last word visually — still split into words to match the
 * source's underlineLastWord() structure exactly, just with no visible
 * effect difference. */
function TitleWords({ text }: { text: string }) {
  return <>{text.trim()}</>
}

export function DarkAbout(props: DarkAboutProps) {
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

  if (!title && !subtitle && !description) return null

  const copy = getHomepageCopy(language)
  const hasStats = statsProjects > 0 || statsClients > 0 || statsYears > 0
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const rootStyle = {
    '--about-accent': accentColor,
    '--about-accent-rgb': hexToRgb(accentColor),
  } as React.CSSProperties

  return (
    <section
      ref={ref}
      id="about"
      className={`reveal ${revealed ? 'active' : ''} relative w-full overflow-hidden py-12 md:py-20`}
      style={rootStyle}
    >
      <div
        aria-hidden="true"
        className={styles.glow}
        style={{
          background: `radial-gradient(circle, ${accentColor}70 0%, ${accentColor}45 24%, ${accentColor}22 46%, transparent 72%)`,
        }}
      />

      <div className={`${styles.inner} relative z-10`}>
        <div className={`${styles.grid} grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20`}>
          <div className={`${styles.gridCol} relative lg:col-span-5`}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={copy.misc.photographerPortraitAlt} className="aspect-[4/5] w-full object-cover" src={imageUrl} />
            ) : null}
            <div
              className={`${styles.imageQuote} absolute -right-6 -bottom-10 hidden max-w-[260px] md:-right-12 md:block`}
            >
              <div className={styles.imageQuoteLine} />
              <p className={styles.imageQuoteName}>— {photographerName}</p>
            </div>
          </div>

          <div className="max-w-2xl lg:col-span-7">
            <DarkSectionEyebrow accentColor={accentColor} align="right">
              ABOUT
            </DarkSectionEyebrow>
            <h2 className={`${styles.title} mb-8`}>
              <TitleWords text={title || copy.about.darkDefaultTitle} />
            </h2>
            <div className="space-y-5">
              {subtitle ? <p className={styles.bodyPrimary}>{subtitle}</p> : null}
              {description ? <p className={styles.bodySecondary}>{description}</p> : null}
            </div>
            {hasStats ? (
              <div className="mt-4 grid max-w-xl grid-cols-3 gap-6 pt-12">
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
        </div>
      </div>
    </section>
  )
}
