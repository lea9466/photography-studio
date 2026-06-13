'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

/** ערכים קבועים ל-SSR — חייבים להתאים בין שרת ללקוח (hydration) */
const SSR_INITIAL = 18
const SSR_STEP = 18

function revealStepSize(): number {
  if (typeof window === 'undefined') return SSR_STEP
  const narrow = window.matchMedia('(max-width: 639px)').matches
  return narrow ? 12 : 24
}

/**
 * חושף פריטים בהדרגה (infinite scroll) כדי לא לרנדר מאות תמונות בבת אחת.
 * מחזיר את מספר הפריטים להצגה ו-ref לעוגן שכשנכנס לתצוגה טוען עוד.
 */
export function useIncrementalReveal(
  total: number,
  step?: number,
  initial?: number
): { count: number; sentinelRef: RefObject<HTMLDivElement | null> } {
  const initialSize = initial ?? SSR_INITIAL
  const [count, setCount] = useState(() => Math.min(initialSize, total))
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const stepRef = useRef(step ?? SSR_STEP)

  useEffect(() => {
    setCount((current) => Math.min(Math.max(current, initialSize), total))
  }, [total, initialSize])

  useEffect(() => {
    stepRef.current = step ?? revealStepSize()
  }, [step])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || count >= total) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          const stepSize = stepRef.current
          setCount((current) => Math.min(current + stepSize, total))
        }
      },
      { rootMargin: '400px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [count, total])

  return { count, sentinelRef }
}
