'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const STATIC_SINGLE_SEGMENT = new Set([
  'admin',
  'platform',
  'studio',
  'contact',
  'g',
])

/** דף בית של צלם: /{slug} — בלי ריווח עליון (ההדר שקוף מעל ה-Hero) */
function isPhotographerHomePath(pathname: string): boolean {
  const match = pathname.match(/^\/([^/]+)\/?$/)
  if (!match) return false
  return !STATIC_SINGLE_SEGMENT.has(match[1])
}

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isRootHome = pathname === '/'
  const skipTopPadding = isRootHome || isPhotographerHomePath(pathname)

  useEffect(() => {
    if (pathname !== '/') return

    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash
    const id =
      hash.length > 1
        ? hash.slice(1)
        : params.has('package') || params.get('source')
          ? 'contact'
          : null

    if (!id) return

    const scrollToTarget = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToTarget)
    })
  }, [pathname])

  return (
    <div className={skipTopPadding ? 'flex-1' : 'flex-1 pt-[4.5rem] md:pt-24'}>
      {children}
    </div>
  )
}
