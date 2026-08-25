'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Ports the old renderer's scroll-to-section mechanism (the inline script
 * built by `generateHomepageSectionScrollScript` in lib/photographer-site-paths.ts,
 * driven by a `?section=xxx` query param — see `homepageSectionHref`, used by
 * every nav link that points at a homepage section, same-page or from another
 * page like the blog). That version scrolled `window.parent` because the
 * real page was the outer iframe host; here the homepage itself IS the real
 * page, so no `window.parent` indirection is needed.
 *
 * Renders nothing — a plain `<a href="#section">` can't be used here because
 * the source's own linking convention is a query param, not a hash fragment,
 * so there's no native browser behavior to rely on; this replicates exactly
 * what the source does, just once, in React instead of a `<script>` tag.
 * `document.getElementById` below is reaching within this same page's own
 * rendered tree (every section id lives in the same HomePage composition
 * this component is rendered inside), not into some other component's DOM —
 * same category as the source's own mechanism, not the "reach into a sibling
 * feature's DOM" pattern the project's no-direct-DOM-manipulation rule rules
 * out.
 *
 * `useSearchParams()` requires a Suspense boundary or Next.js bails out of
 * static prerendering entirely at build time (only surfaces during a real
 * `next build`, never in `next dev` — which is exactly why this went
 * unnoticed through the whole rebuild). The boundary lives here, inside the
 * component itself, so every call site (every theme's HomePage) stays a
 * plain `<ScrollToInitialSection />` with no extra wrapping to remember.
 */
export function ScrollToInitialSection() {
  return (
    <Suspense fallback={null}>
      <ScrollToInitialSectionInner />
    </Suspense>
  )
}

function ScrollToInitialSectionInner() {
  const searchParams = useSearchParams()
  const sectionFromQuery = searchParams.get('section')

  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, '').trim()
    const rawSectionId = sectionFromQuery?.trim() || fromHash || null
    if (!rawSectionId) return

    const sectionId = rawSectionId.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!sectionId) return

    function cleanUrl() {
      if (window.location.search || window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    function scrollToSection() {
      const el = document.getElementById(sectionId)
      if (!el) return false
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      cleanUrl()
      return true
    }

    if (scrollToSection()) return

    let attempts = 0
    const timer = window.setInterval(() => {
      attempts += 1
      if (scrollToSection() || attempts >= 30) {
        window.clearInterval(timer)
      }
    }, 100)

    return () => window.clearInterval(timer)
  }, [sectionFromQuery])

  return null
}
