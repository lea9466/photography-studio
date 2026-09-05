import type { ReactNode } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ABOUT_TONE, type AboutTone } from './AboutKit'

export type AboutFlowStep = {
  icon: ReactNode
  title: string
  caption?: string
  tone?: AboutTone
}

/**
 * A responsive numbered flow diagram: a horizontal row of connected step
 * cards on desktop, a vertical stack on mobile. The connector chevron points
 * "forward" — left in this RTL app on desktop, down on mobile.
 */
export function AboutFlow({ steps }: { steps: AboutFlowStep[] }) {
  return (
    <ol className="flex flex-col gap-2 md:flex-row md:items-stretch">
      {steps.map((step, index) => {
        const t = ABOUT_TONE[step.tone ?? 'plum']
        const isLast = index === steps.length - 1
        return (
          <li
            key={step.title}
            className="flex flex-col md:flex-1 md:flex-row md:items-stretch"
          >
            <div
              className={cn(
                'flex flex-1 items-start gap-3 rounded-2xl border p-4 md:flex-col md:gap-2.5',
                t.surface
              )}
            >
              <div
                className={cn(
                  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  t.icon
                )}
              >
                {step.icon}
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#7D3A52] text-[9px] font-bold text-white ring-2 ring-white">
                  {index + 1}
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[--foreground]">
                  {step.title}
                </p>
                {step.caption ? (
                  <p className="text-xs leading-relaxed text-[--muted]">
                    {step.caption}
                  </p>
                ) : null}
              </div>
            </div>
            {!isLast ? (
              <span
                aria-hidden
                className="flex items-center justify-center py-1 text-[#7D3A52]/35 md:self-center md:px-1 md:py-0"
              >
                <ChevronDown className="h-5 w-5 md:hidden" />
                <ChevronLeft className="hidden h-5 w-5 md:block" />
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
