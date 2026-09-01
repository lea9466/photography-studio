'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getDashboardNavItems,
  DASHBOARD_NAV_GROUPS,
  type DashboardNavItem,
} from './dashboard-nav-config'
import { SubscriptionPlanBadge } from './SubscriptionPlanBadge'

type DashboardNavMenuProps = {
  onNavigate?: () => void
  className?: string
  siteUnavailableLocked?: boolean
  isPro?: boolean
  /** custom_domain is excluded from trial/pre-launch (see lib/subscriptions/entitlements.ts's buildFeatures) — its own lock check, separate from the plain isPro every other PRO feature uses. */
  canUseCustomDomain?: boolean
  canCreateClientGalleries?: boolean
}

export function DashboardNavMenu({
  onNavigate,
  className,
  siteUnavailableLocked = false,
  isPro = true,
  canUseCustomDomain = true,
  canCreateClientGalleries = false,
}: DashboardNavMenuProps) {
  const pathname = usePathname()
  const navItems = getDashboardNavItems({ canCreateClientGalleries })

  function renderItem(item: DashboardNavItem) {
    const active = item.isActive(pathname)
    const lockedByUnavailable =
      siteUnavailableLocked && item.href !== '/dashboard/subscription'
    const lockedByPlan =
      item.proFeature === 'custom_domain' ? !canUseCustomDomain : !isPro && item.proFeature != null
    const badgePlan =
      item.href === '/dashboard/subscription'
        ? isPro
          ? 'pro'
          : 'free'
        : item.badge

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
          'group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
          active
            ? 'bg-[--dashboard-accent]/10 text-[--dashboard-accent] font-semibold border-r-4 border-[--dashboard-accent] pr-3'
            : 'text-[--dashboard-muted] hover:text-[--dashboard-foreground] hover:bg-[--dashboard-surface] pr-4'
        )}
      >
        {item.icon}
        <span className="text-sm flex-1">{item.label}</span>
        {lockedByPlan ? (
          <>
            <Lock className="h-4 w-4 shrink-0 text-[#7D3A52]/60" aria-hidden />
            <span
              role="tooltip"
              className="pointer-events-none absolute end-2 top-full z-[100] mt-1.5 w-64 max-w-[80vw] rounded-lg bg-[#2b2530] px-3 py-2.5 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
            >
              {item.lockedTooltip ?? 'התכונה הזו חסומה בגרסה החינמית — שדרגי לפרו'}
            </span>
          </>
        ) : badgePlan ? (
          <SubscriptionPlanBadge plan={badgePlan} />
        ) : null}
      </Link>
    )
  }

  return (
    <nav className={cn('space-y-1', className)}>
      {siteUnavailableLocked ? (
        <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-800">
          האתר אינו זמין כרגע. ניתן לגשת רק לעמוד המינוי כדי לחדש גישה.
        </p>
      ) : null}
      {DASHBOARD_NAV_GROUPS.map((navGroup) => {
        const groupItems = navItems.filter((item) => item.group === navGroup.id)
        if (groupItems.length === 0) return null
        return (
          <div key={navGroup.id} className="space-y-1 pt-6 first:pt-0">
            <p className="px-4 pb-1 text-[11px] font-bold tracking-wide text-[--dashboard-muted]">
              {navGroup.label}
            </p>
            {groupItems.map(renderItem)}
          </div>
        )
      })}
    </nav>
  )
}
