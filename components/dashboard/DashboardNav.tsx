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
    href: '/dashboard/packages',
    label: 'חבילות',
    isActive: (pathname) => pathname.startsWith('/dashboard/packages'),
  },
  {
    href: '/dashboard/reviews',
    label: 'תגובות',
    isActive: (pathname) => pathname.startsWith('/dashboard/reviews'),
  },
  {
    href: '/dashboard/settings',
    label: 'הגדרות',
    isActive: (pathname) => pathname.startsWith('/dashboard/settings'),
  },
]

type DashboardNavProps = {
  publicSitePath?: string | null
}

export function DashboardNav({ publicSitePath }: DashboardNavProps) {
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
      {publicSitePath ? (
        <Link
          href={publicSitePath}
          target="_blank"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-[--muted] transition-colors hover:text-[--foreground]"
        >
          דף ציבורי
        </Link>
      ) : null}
    </nav>
  )
}
