'use client'

import { useEffect, useState } from 'react'

/**
 * Modern-theme-only helper: flips true one frame after mount. Backs the
 * `.animate-reveal`/`.delay-*` classes ported into modern-theme.css — those
 * animate in immediately on page load (the hero/about content and stats
 * cards are above the fold), unlike `useRevealOnScroll` (shared/), which
 * waits for an IntersectionObserver hit. Starting from `false` and flipping
 * in an effect (rather than `true` from the first render) is what actually
 * lets the CSS `animation` re-trigger — a class already present at first
 * paint wouldn't animate.
 */
export function useMountedReveal() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return mounted
}
