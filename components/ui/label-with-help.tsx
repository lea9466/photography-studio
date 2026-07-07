'use client'

import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { cn } from '@/lib/utils'

type LabelWithHelpProps = {
  htmlFor?: string
  children: ReactNode
  help: string
  where?: string
  className?: string
}

export function LabelWithHelp({
  htmlFor,
  children,
  help,
  where,
  className,
}: LabelWithHelpProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{children}</Label>
      <HelpTooltip content={help} where={where} />
    </div>
  )
}
