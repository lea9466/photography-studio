'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Deep-links a manage-page section into view. The "client finished selecting"
 * email links here with `?section=selections` — a query param, not a `#hash`,
 * because email click-tracking (Resend) strips URL fragments on its redirect.
 *
 * Uses `window.scrollTo`, not `el.scrollIntoView()`: `body { overflow-x: hidden }`
 * (globals.css) turns <body> into a scroll container, which makes scrollIntoView
 * and native `#anchor` jumps unreliable in Chrome. Re-aligns every frame for
 * ~1.2s to beat the browser's post-load scroll reset and late layout shifts
 * (fonts, hydration of the forms above), and hands control back the moment the
 * user scrolls.
 */
export function ScrollToSection() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // useSearchParams is the primary source; fall back to the raw URL (covers a
    // stale hook right after a client nav) and to a legacy `#hash` link.
    const section =
      searchParams.get('section') ||
      new URLSearchParams(window.location.search).get('section') ||
      window.location.hash.replace(/^#/, '') ||
      null
    if (!section) return

    let done = false
    const release = () => {
      done = true
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchmove', release)
      window.removeEventListener('keydown', release)
    }
    window.addEventListener('wheel', release, { passive: true })
    window.addEventListener('touchmove', release, { passive: true })
    window.addEventListener('keydown', release)

    const startedAt = performance.now()
    const align = () => {
      if (done) return
      const el = document.getElementById(section)
      if (el) {
        const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
        const target = Math.max(
          0,
          el.getBoundingClientRect().top + window.scrollY - marginTop
        )
        if (Math.abs(target - window.scrollY) > 2) window.scrollTo(0, target)
      }
      if (performance.now() - startedAt < 1200) requestAnimationFrame(align)
      else release()
    }
    requestAnimationFrame(align)

    return release
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
