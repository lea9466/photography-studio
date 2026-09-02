'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Deep-links a manage-page section into view. The "client finished selecting"
 * email links here with `?section=selections` — a query param, not a `#hash`,
 * because email click-tracking (Resend) drops URL fragments on its redirect,
 * so the native anchor never survives the hop from the inbox.
 *
 * Retries across a few frames: the manage page hydrates client components
 * (settings form, actions) above the target, so the element's final offset
 * isn't known on the first frame. A single delayed re-scroll corrects for
 * late layout shifts (fonts) without fighting a user who already scrolled.
 */
export function ScrollToSection() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const section = searchParams.get('section')
    if (!section) return

    let frame = 0
    let timer: ReturnType<typeof setTimeout>

    const scroll = () => {
      const el = document.getElementById(section)
      if (!el) {
        if (frame++ < 30) requestAnimationFrame(scroll)
        return
      }
      el.scrollIntoView({ block: 'start' })
      const settled = window.scrollY
      timer = setTimeout(() => {
        if (Math.abs(window.scrollY - settled) < 4) {
          el.scrollIntoView({ block: 'start' })
        }
      }, 350)
    }
    requestAnimationFrame(scroll)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
