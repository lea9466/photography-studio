'use client'

import { useEffect, useRef, useState } from 'react'

/** Fires once, the first time the ref'd element scrolls into view — used to
 *  trigger each section's entrance animation only when it's actually about
 *  to be seen.
 *
 *  `rootMargin` shrinks (negative values) or grows the viewport the element
 *  is tested against — e.g. `'0px 0px -18% 0px'` means "not until it's
 *  inside the top 82% of the screen", so an entrance waits until the content
 *  has actually come up into view instead of firing while it's still just
 *  peeking over the bottom edge. Optional; omitted = the plain viewport. */
export function useInView(threshold = 0.15, rootMargin?: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, inView] as const
}
