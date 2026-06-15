'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  isActive: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'גלריות',
    isActive: (pathname) =>
      pathname === '/dashboard' ||
      pathname.startsWith('/dashboard/galleries'),
  },
  {
    href: '/dashboard/settings',
    label: 'הגדרות',
    isActive: (pathname) => pathname.startsWith('/dashboard/settings'),
  },
]

type DashboardNavProps = {
  portfolioSlug?: string | null
}

export function DashboardNav({ portfolioSlug }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-lg border border-[--border] bg-[--background] p-1">
      {NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-[--accent] text-[--background]'
                : 'text-[--muted] hover:text-[--foreground]'
            )}
          >
            {item.label}
          </Link>
        )
      })}
      {portfolioSlug ? (
        <Link
          href={`/portfolio/${portfolioSlug}`}
          target="_blank"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-[--muted] transition-colors hover:text-[--foreground]"
        >
          דף ציבורי
        </Link>
      ) : null}
    </nav>
  )
}
