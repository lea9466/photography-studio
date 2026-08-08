'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DASHBOARD_NAV_ITEMS } from './dashboard-nav-config'
import { SubscriptionPlanBadge } from './SubscriptionPlanBadge'

type DashboardNavMenuProps = {
  onNavigate?: () => void
  className?: string
  siteUnavailableLocked?: boolean
}

export function DashboardNavMenu({
  onNavigate,
  className,
  siteUnavailableLocked = false,
}: DashboardNavMenuProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('space-y-1', className)}>
      {siteUnavailableLocked ? (
        <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-800">
          האתר אינו זמין כרגע. ניתן לגשת רק לעמוד המינוי כדי לחדש גישה.
        </p>
      ) : null}
      {DASHBOARD_NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname)
        const lockedByUnavailable =
          siteUnavailableLocked && item.href !== '/dashboard/subscription'

        if (item.frozen || lockedByUnavailable) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              title={lockedByUnavailable ? 'לא זמין כרגע' : 'בקרוב'}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 rounded-xl border',
                'opacity-45 cursor-not-allowed select-none pointer-events-none',
                'text-[--dashboard-muted] pr-4',
                lockedByUnavailable
                  ? 'border-rose-200/80 bg-rose-50/40'
                  : 'border-[#c9c5cd]'
              )}
            >
              {item.frozen && !lockedByUnavailable ? (
                <span className="absolute top-1.5 left-2 rounded-full bg-[#79767d] px-2.5 py-0.5 text-[10px] font-semibold text-white leading-none">
                  בקרוב
                </span>
              ) : null}
              {item.icon}
              <span className="text-sm flex-1">{item.label}</span>
              {lockedByUnavailable ? (
                <Lock className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
              ) : null}
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
            <span className="text-sm flex-1">{item.label}</span>
            {item.badge ? <SubscriptionPlanBadge plan={item.badge} /> : null}
          </Link>
        )
      })}
    </nav>
  )
}
