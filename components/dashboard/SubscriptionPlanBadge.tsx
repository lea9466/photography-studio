import { cn } from '@/lib/utils'

const PLAN_BADGE_CONFIG = {
  free: {
    label: 'FREE',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
} as const

type SubscriptionPlanBadgeProps = {
  plan: keyof typeof PLAN_BADGE_CONFIG
  className?: string
}

export function SubscriptionPlanBadge({ plan, className }: SubscriptionPlanBadgeProps) {
  const config = PLAN_BADGE_CONFIG[plan]

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
