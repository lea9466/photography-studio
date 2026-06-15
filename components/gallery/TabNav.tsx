'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '', label: 'סקירה', description: 'מידע ופעולות' },
  { href: '/photos', label: 'תמונות', description: 'העלאה וניהול' },
  { href: '/selections', label: 'בחירות', description: 'בחירות הלקוח ומעובדות' },
  { href: '/settings', label: 'הגדרות', description: 'עריכת גלריה' },
] as const

type TabNavProps = {
  galleryId: string
}

export function TabNav({ galleryId }: TabNavProps) {
  const pathname = usePathname()
  const base = `/dashboard/galleries/${galleryId}`

  return (
    <nav
      aria-label="ניווט גלריה"
      className="flex flex-wrap gap-1 rounded-lg border border-[--border] bg-[--background] p-1"
    >
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
            aria-current={isActive ? 'page' : undefined}
            title={tab.description}
            className={cn(
              'flex flex-col rounded-md px-3 py-2 transition-colors sm:py-1.5',
              isActive
                ? 'bg-[--accent] text-[--background]'
                : 'text-[--muted] hover:text-[--foreground]'
            )}
          >
            <span className="text-sm font-medium">{tab.label}</span>
            <span
              className={cn(
                'hidden text-xs sm:block',
                isActive ? 'text-[--background]/70' : 'text-[--muted]'
              )}
            >
              {tab.description}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
