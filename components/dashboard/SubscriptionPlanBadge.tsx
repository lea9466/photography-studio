'use client'

import { cn } from '@/lib/utils'

const PLAN_BADGE_CONFIG = {
  free: {
    label: 'FREE',
    className: 'bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/15',
  },
  new: {
    label: 'NEW!',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  },
} as const

type SubscriptionPlanBadgeProps = {
  plan: keyof typeof PLAN_BADGE_CONFIG
  className?: string
}

export function SubscriptionPlanBadge({ plan, className }: SubscriptionPlanBadgeProps) {
  const config = PLAN_BADGE_CONFIG[plan]
  if (!config) return null

  return (
    <span
      className={cn(
        'text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
