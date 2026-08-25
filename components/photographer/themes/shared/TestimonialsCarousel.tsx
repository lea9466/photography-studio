'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './TestimonialsCarousel.module.css'

export type TestimonialsCarouselProps = {
  /** Pre-rendered, theme-specific testimonial cards (one per testimonial). */
  items: React.ReactNode[]
  language: SiteLanguage
}

const AUTO_ADVANCE_MS = 5000
const DESKTOP_QUERY = '(min-width: 1024px)'

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => setIsDesktop(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

/**
 * The default (non-marquee) `testimonial_layout_type` once a studio has more
 * than 3 testimonials — ports `.classic-testimonials-*` +
 * TESTIMONIALS_CAROUSEL_INIT_SCRIPT (lib/homepage-themes/generate-homepage-html.ts
 * ~line 1554, shared-styles.ts ~3649) as real React state instead of a
 * global `document.getElementById`/interval script. The caller (each theme's
 * TestimonialsSection) is responsible for the `<= 3 testimonials -> plain
 * static row` branch — this component only renders once there's more than
 * one 3-card slide to page through.
 *
 * Desktop-only sliding + dot pagination, auto-advancing every 5s and
 * resetting on manual navigation, exactly like the source. Below 1024px the
 * source disables the slider but keeps the 3-card *slide* markup clipped by
 * `overflow:hidden` — meaning only the first sliding-window's cards are ever
 * reachable, everything past that is invisible with no way to see it. Lea
 * flagged that this looks broken in practice (confirmed via screenshot), so
 * below desktop this renders every testimonial in one plain flex-wrap row
 * instead of the windowed/sliding structure — no separate "2-per-tablet"
 * logic needed, since each theme's own card CSS already goes to 2-per-row
 * at tablet and 1-per-row (single column) at mobile via its own breakpoints.
 *
 * The mobile/tablet row also skips `.bleed` (the full-100vw-width wrapper
 * the desktop carousel uses, matching the source's `.testimonials-bleed`
 * exactly) — Lea confirmed (screenshot) the card touching the screen edge
 * with zero side margin looks wrong there, unlike the marquee's continuous
 * belt where edge-to-edge is the point. `.stack` instead gives it the same
 * side padding every other section uses.
 */
export function TestimonialsCarousel({ items, language }: TestimonialsCarouselProps) {
  const isDesktop = useIsDesktop()

  const slides = useMemo(() => {
    const groups: React.ReactNode[][] = []
    for (let i = 0; i < items.length - 2; i++) {
      groups.push(items.slice(i, i + 3))
    }
    return groups
  }, [items])

  const [index, setIndex] = useState(0)
  const [resetSignal, setResetSignal] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [isDesktop, slides.length])

  useEffect(() => {
    if (!isDesktop || slides.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
    // resetSignal restarts this exact 5s window after a manual dot click,
    // matching the source's resetTimer() call — index itself is deliberately
    // NOT a dependency so a natural auto-advance tick doesn't also restart it.
  }, [isDesktop, slides.length, resetSignal])

  function goTo(i: number) {
    setIndex(i)
    setResetSignal((s) => s + 1)
  }

  if (!isDesktop) {
    return (
      <div className={styles.stack}>
        <div className={styles.row}>{items}</div>
      </div>
    )
  }

  if (slides.length <= 1) return null

  const dotLabel = language === 'en' ? 'Testimonials page' : 'עמוד תגובות'

  return (
    <div className={styles.bleed}>
      <div className={styles.carousel}>
        <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((slide, i) => (
            <div className={styles.slide} key={i}>
              <div className={styles.row}>{slide}</div>
            </div>
          ))}
        </div>

        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === index ? `${styles.dot} ${styles.dotActive}` : styles.dot}
              aria-label={`${dotLabel} ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
