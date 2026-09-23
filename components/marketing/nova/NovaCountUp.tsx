'use client'

import { useEffect, useRef, useState } from 'react'

type NovaCountUpProps = {
  value: number
  suffix?: string
  durationMs?: number
  className?: string
}

const numberFormat = new Intl.NumberFormat('he-IL')

// The server renders the real final number (correct with no JS, and for
// crawlers). On the client it rewinds to 0 and counts up once it scrolls
// into view — unless the visitor prefers reduced motion, in which case it
// just stays put.
export function NovaCountUp({ value, suffix = '', durationMs = 1600, className }: NovaCountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [current, setCurrent] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    setCurrent(0)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const startedAt = performance.now()
        const tick = (now: number) => {
          const progress = Math.min(1, (now - startedAt) / durationMs)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCurrent(Math.round(value * eased))
          if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.6 }
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, durationMs])

  const finalText = `${numberFormat.format(value)}${suffix}`

  return (
    <>
      {/* dir="ltr" keeps the "+" after the digits inside the RTL page */}
      <span ref={ref} dir="ltr" aria-hidden className={className}>
        {numberFormat.format(current)}
        {suffix}
      </span>
      <span className="sr-only">{finalText}</span>
    </>
  )
}
