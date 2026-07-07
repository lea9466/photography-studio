'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DASHBOARD_NAV_ITEMS } from './dashboard-nav-config'

type DashboardNavMenuProps = {
  onNavigate?: () => void
  className?: string
}

export function DashboardNavMenu({ onNavigate, className }: DashboardNavMenuProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('space-y-1', className)}>
      {DASHBOARD_NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname)

        if (item.frozen) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 rounded-xl border border-[#c9c5cd]',
                'opacity-40 cursor-not-allowed select-none pointer-events-none',
                'text-[--dashboard-muted] pr-4'
              )}
            >
              <span className="absolute top-1.5 left-2 rounded-full bg-[#79767d] px-2.5 py-0.5 text-[10px] font-semibold text-white leading-none">
                בקרוב
              </span>
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </span>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              active
                ? 'bg-[--dashboard-accent]/10 text-[--dashboard-accent] font-semibold border-r-4 border-[--dashboard-accent] pr-3'
                : 'text-[--dashboard-muted] hover:text-[--dashboard-foreground] hover:bg-[--dashboard-surface] pr-4'
            )}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
