'use client'

import { useEffect, useRef, useState } from 'react'

export type UseRevealOnScrollOptions = {
  /** IntersectionObserver threshold. Defaults match HOMEPAGE_REVEAL_INIT_SCRIPT. */
  threshold?: number
  /** IntersectionObserver rootMargin. Defaults match HOMEPAGE_REVEAL_INIT_SCRIPT. */
  rootMargin?: string
  /**
   * Extra delay (ms) applied after intersection before flipping `revealed`.
   * Used by per-cell staggered grids (see RECENT_PHOTOS_REVEAL_SCRIPT in
   * lib/homepage-themes/shared-styles.ts, which does the same
   * intersect-then-setTimeout dance per `.recent-photo-cell`). Defaults to 0
   * (reveal immediately on intersection), matching every existing caller.
   */
  delayMs?: number
}

/**
 * React port of HOMEPAGE_REVEAL_INIT_SCRIPT (lib/homepage-themes/shared-styles.ts):
 * fades a section in once it scrolls into view. Same threshold/rootMargin as
 * the original page-wide IntersectionObserver, but scoped to the one element
 * a component actually owns (via the returned ref) instead of a global
 * `document.querySelectorAll('.reveal')` scan — no DOM access outside what
 * this component itself renders.
 */
export function useRevealOnScroll<T extends HTMLElement>(options: UseRevealOnScrollOptions = {}) {
  const { threshold = 0.08, rootMargin = '0px 0px 8% 0px', delayMs = 0 } = options
  const ref = useRef<T>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delayMs > 0) {
            timeoutId = setTimeout(() => setRevealed(true), delayMs)
          } else {
            setRevealed(true)
          }
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [threshold, rootMargin, delayMs])

  return { ref, revealed }
}
