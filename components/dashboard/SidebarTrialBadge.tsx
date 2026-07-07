'use client'

import { daysUntilTrialEnd } from '@/lib/referral/referral-utils'

type SidebarTrialBadgeProps = {
  trialEndDate: string
  compact?: boolean
}

export function SidebarTrialBadge({
  trialEndDate,
  compact = false,
}: SidebarTrialBadgeProps) {
  const daysLeft = daysUntilTrialEnd(trialEndDate)

  if (compact) {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[--dashboard-border] bg-[--dashboard-surface] text-[--dashboard-accent] font-bold text-sm"
        title={`${daysLeft} ימים חינם נשארו`}
      >
        {daysLeft}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[--dashboard-accent]/20 bg-[--dashboard-accent]/5 px-4 py-3">
      <p className="text-xs text-[--dashboard-muted]">ימים חינם נשארו</p>
      <p className="text-2xl font-bold text-[--dashboard-accent]">{daysLeft}</p>
    </div>
  )
}
