'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type RevealProps = {
  children: React.ReactNode
  className?: string
  delayMs?: number
  as?: 'div' | 'li'
}

export function Reveal({ children, className = '', delayMs = 0, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Tag = as

  return (
    <Tag
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className
      )}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
