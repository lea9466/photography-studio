'use client'

import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { useMountedReveal } from './useMountedReveal'
import styles from './ModernAboutStatement.module.css'

export type ModernAboutStatementProps = {
  /** aboutDescription, not aboutText — mirrors classic/dark/elegant's
   * separate About section, which shows the fuller about_description body
   * (their hero carries the short about_text blurb instead, same as
   * ModernHero now does). */
  text: string | null
  imageUrl: string | null
  accentColor: string
  language: SiteLanguage
}

/**
 * A wide editorial "statement" section pulled from the studio's
 * about_description, paired with the about photo in a camera-viewfinder
 * frame — new to the modern theme (the old renderer never gave modern a
 * standalone About section or an about photo at all; ModernHero.tsx carries
 * the shorter about_text blurb instead, and that stays as-is). Sits between
 * the hero and ModernAbout's stat cards. Purely additive: renders nothing
 * when the studio hasn't set about_description. The frame always renders —
 * a metallic, accent-tinted placeholder fills it when there's no photo, so
 * the section never degrades to plain unframed text.
 */
export function ModernAboutStatement({ text, imageUrl, accentColor, language }: ModernAboutStatementProps) {
  const trimmed = text?.trim()
  if (!trimmed) return null

  const copy = getHomepageCopy(language)
  const mounted = useMountedReveal()
  const reveal = (extra = '') => `animate-reveal ${extra} ${mounted ? 'is-mounted' : ''}`.trim()

  return (
    <section className={styles.section} style={{ '--modern-accent': accentColor } as React.CSSProperties}>
      <div className={`${styles.inner} ${styles.innerWithImage}`}>
        <div className={`${styles.frameWrap} ${reveal()}`}>
          <div className={styles.frame}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={copy.misc.photographerPortraitAlt} className={styles.image} />
            ) : (
              <div className={styles.placeholder} aria-hidden="true">
                <span className="material-symbols-outlined">photo_camera</span>
              </div>
            )}
            <span className={`${styles.corner} ${styles.cornerTl}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerTr}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerBl}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerBr}`} aria-hidden="true" />
            <span className={styles.shutter} aria-hidden="true">
              <span className="material-symbols-outlined">photo_camera</span>
            </span>
          </div>
        </div>

        <div className={`${styles.copy} ${reveal('delay-100')}`}>
          <ModernSectionEyebrow align="right">OUR STORY</ModernSectionEyebrow>
          <p className={styles.statement}>{trimmed}</p>
          <span className={styles.rule} aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
