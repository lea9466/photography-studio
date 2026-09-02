'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type BackToTopButtonProps = {
  /**
   * Extra classes for the fixed control — used to lift it above a bottom bar
   * that's only present in some gallery states (e.g. the selection bar).
   */
  className?: string
}

/**
 * A fixed, round "back to top" control for the long client-gallery page. It
 * appears once the viewer has scrolled past the first screen and returns to the
 * top of the document through a native `#top` anchor — the smooth motion comes
 * from the scoped `scroll-behavior` rule in globals.css, so there's no
 * imperative scroll call here. Purely presentational.
 */
export function BackToTopButton({ className }: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href="#top"
      aria-label="חזרה לראש הדף"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        'fixed bottom-6 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg shadow-black/25 ring-1 ring-white/20 transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 motion-reduce:transition-none sm:bottom-8 sm:right-6',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
        className
      )}
      style={{ backgroundColor: 'var(--client-accent)' }}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </a>
  )
}
