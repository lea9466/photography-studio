'use client'

import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type HelpTooltipProps = {
  content: string
  where?: string
  className?: string
  side?: 'top' | 'bottom'
  iconClassName?: string
}

export function HelpTooltip({
  content,
  where,
  className,
  side = 'top',
  iconClassName,
}: HelpTooltipProps) {
  return (
    <span
      className={cn('relative inline-flex shrink-0 group/help', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <span
        tabIndex={0}
        role="img"
        aria-label="הסבר"
        className="inline-flex items-center justify-center rounded-full text-[--muted] hover:text-[--foreground] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--foreground]/20 transition-colors cursor-help"
      >
        <HelpCircle className={cn('h-4 w-4', iconClassName)} />
      </span>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-[100] w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-[--border] bg-white p-3 text-xs leading-relaxed text-[--foreground] shadow-lg opacity-0 invisible transition-opacity dark:bg-zinc-900',
          'group-hover/help:opacity-100 group-hover/help:visible group-focus-within/help:opacity-100 group-focus-within/help:visible',
          side === 'top'
            ? 'bottom-full mb-2 end-0 sm:end-auto sm:start-1/2 sm:-translate-x-1/2'
            : 'top-full mt-2 end-0 sm:end-auto sm:start-1/2 sm:-translate-x-1/2'
        )}
      >
        <p>{content}</p>
        {where ? (
          <p className="mt-2 border-t border-[--border] pt-2 text-[--muted]">
            <span className="font-medium text-[--foreground]">מיקום באתר: </span>
            {where}
          </p>
        ) : null}
      </span>
    </span>
  )
}
