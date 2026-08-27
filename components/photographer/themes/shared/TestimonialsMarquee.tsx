'use client'

import { useEffect, useRef } from 'react'
import styles from './TestimonialsMarquee.module.css'

export type TestimonialsMarqueeProps = {
  /** Pre-rendered, theme-specific testimonial cards (one per testimonial). */
  items: React.ReactNode[]
}

const SPEED_PX_PER_SEC = 55
const MAX_CARD_WIDTH_PX = 384 // 24rem — same fixed max width as the static grid

/**
 * The `testimonial_layout_type === 'marquee'` studio setting — ports
 * TESTIMONIALS_MARQUEE_INIT_SCRIPT + the `.testimonials-marquee*` rules in
 * lib/homepage-themes/shared-styles.ts (~line 3227, script ~3727) as real
 * React: two identical, contiguous card sets driven by the Web Animations
 * API instead of a global `document.querySelectorAll` script. Every DOM
 * query below is scoped to this component's own `containerRef` subtree
 * (never a global selector reaching into someone else's tree), matching the
 * project's no-direct-DOM-manipulation rule.
 *
 * Card width is computed so exactly 3 (desktop) / 2 (tablet) / 1 (mobile)
 * cards fill the container, then the whole track slides by exactly one
 * set's width — a duplicate set only renders (`willScroll`) once there are
 * more cards than fit in one view, otherwise it's a static centered row,
 * matching the source exactly.
 */
export function TestimonialsMarquee({ items }: TestimonialsMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const setARef = useRef<HTMLDivElement>(null)
  const setBRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<Animation | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    const setA = setARef.current
    const setB = setBRef.current
    if (!container || !track || !setA || !setB) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let debounceId: ReturnType<typeof setTimeout> | undefined

    function measureAndAnimate() {
      const containerWidth = Math.round(container!.getBoundingClientRect().width)
      if (!containerWidth) return

      const visibleW = document.documentElement.clientWidth || window.innerWidth
      const perView = visibleW >= 1024 ? 3 : visibleW >= 768 ? 2 : 1
      const gapPx = visibleW >= 1024 ? 48 : visibleW >= 768 ? 36 : 28

      const itemsA = Array.from(setA!.children) as HTMLElement[]
      const itemsB = Array.from(setB!.children) as HTMLElement[]
      const unique = itemsA.length
      const willScroll = !reducedMotion && unique > perView

      let cardW = Math.floor((containerWidth - (perView - 1) * gapPx) / perView)
      if (cardW > MAX_CARD_WIDTH_PX) cardW = MAX_CARD_WIDTH_PX
      // Sizing has to land on the card's OWN root element, not this `.item`
      // wrapper — the per-theme card CSS bakes in its own 3-column
      // `calc((100% - 5.5rem) / 3)` max-width formula (see e.g.
      // ClassicTestimonialCard.module.css), which resolves against whatever
      // it's actually nested inside. Only an inline style on the card itself
      // (higher specificity than any class rule) reliably overrides that;
      // sizing the wrapper instead left the card free to divide the
      // already-narrowed wrapper width by 3 again, collapsing it to ~30px
      // and forcing every word onto its own line.
      for (const wrapper of [...itemsA, ...itemsB]) {
        const card = wrapper.firstElementChild as HTMLElement | null
        if (!card) continue
        card.style.width = `${cardW}px`
        card.style.minWidth = `${cardW}px`
        card.style.maxWidth = `${cardW}px`
        card.style.flex = `0 0 ${cardW}px`
      }

      if (animRef.current) {
        try {
          animRef.current.cancel()
        } catch {
          // animation already finished/cancelled
        }
        animRef.current = null
      }

      if (!willScroll) {
        setB!.style.display = 'none'
        track!.style.width = '100%'
        track!.style.justifyContent = 'center'
        track!.style.transform = 'none'
        setA!.style.marginInline = 'auto'
        return
      }

      setB!.style.display = 'flex'
      track!.style.width = ''
      track!.style.justifyContent = ''
      track!.style.transform = ''
      setA!.style.marginInline = ''

      const trackGap = parseFloat(getComputedStyle(track!).gap) || gapPx
      const shift = unique * cardW + Math.max(0, unique - 1) * gapPx + Math.round(trackGap)
      if (shift < 1) return

      const duration = (shift / SPEED_PX_PER_SEC) * 1000
      animRef.current = track!.animate(
        [{ transform: 'translate3d(0px, 0, 0)' }, { transform: `translate3d(${-shift}px, 0, 0)` }],
        { duration, iterations: Infinity, easing: 'linear' }
      )
    }

    function schedule() {
      if (debounceId) clearTimeout(debounceId)
      debounceId = setTimeout(measureAndAnimate, 150)
    }

    schedule()

    window.addEventListener('resize', schedule)
    document.fonts?.ready?.then(schedule).catch(() => {})

    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(container)

    const images = container.querySelectorAll('img')
    images.forEach((img) => {
      if (img.complete) return
      img.addEventListener('load', schedule, { once: true })
      img.addEventListener('error', schedule, { once: true })
    })

    return () => {
      if (debounceId) clearTimeout(debounceId)
      window.removeEventListener('resize', schedule)
      resizeObserver.disconnect()
      if (animRef.current) {
        try {
          animRef.current.cancel()
        } catch {
          // animation already finished/cancelled
        }
      }
    }
  }, [items])

  return (
    <div className={styles.bleed}>
      <div ref={containerRef} className={styles.marquee} data-testimonials-marquee>
        <div ref={trackRef} className={styles.track}>
          <div ref={setARef} className={styles.set}>
            {items.map((item, i) => (
              <div className={styles.item} key={i}>
                {item}
              </div>
            ))}
          </div>
          <div ref={setBRef} className={styles.set} aria-hidden="true">
            {items.map((item, i) => (
              <div className={styles.item} key={i}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
