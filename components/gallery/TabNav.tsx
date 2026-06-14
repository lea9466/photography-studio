'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '', label: 'סקירה' },
  { href: '/photos', label: 'תמונות' },
  { href: '/selections', label: 'בחירות' },
  { href: '/upload-edited', label: 'מעובדות' },
  { href: '/settings', label: 'הגדרות' },
] as const

type TabNavProps = {
  galleryId: string
}

export function TabNav({ galleryId }: TabNavProps) {
  const pathname = usePathname()
  const base = `/dashboard/galleries/${galleryId}`

  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-[--border] bg-[--background] p-1">
      {TABS.map((tab) => {
        const href = tab.href ? `${base}${tab.href}` : base
        const isActive =
          tab.href === ''
            ? pathname === base
            : pathname.startsWith(`${base}${tab.href}`)

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[--accent] text-[--background]'
                : 'text-[--muted] hover:text-[--foreground]'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
