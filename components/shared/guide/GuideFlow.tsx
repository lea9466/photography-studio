import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  guideAccent,
  guideTones,
  type GuideTone,
  type GuideVariant,
} from './guide-tones'

export type GuideFlowStep = {
  icon: ReactNode
  title: string
  caption?: string
  tone?: GuideTone
}

/**
 * A responsive numbered flow diagram. Desktop: a horizontal row of equal
 * step cards joined by "forward" chevrons (left, in this RTL app). Mobile: a
 * two-column grid of the same boxy cards — the numbered badges carry the
 * order, so no connectors. `variant` picks the accent hue (burgundy in the
 * dashboard, violet on marketing).
 */
export function GuideFlow({
  steps,
  variant = 'burgundy',
}: {
  steps: GuideFlowStep[]
  variant?: GuideVariant
}) {
  const tones = guideTones(variant)
  const accent = guideAccent(variant)

  return (
    <ol className="grid grid-cols-2 gap-2.5 md:flex md:flex-row md:items-stretch md:gap-2">
      {steps.map((step, index) => {
        const t = tones[step.tone ?? 'accent']
        const isLast = index === steps.length - 1
        return (
          <li
            key={step.title}
            className="md:flex md:flex-1 md:flex-row md:items-stretch"
          >
            <div
              className={cn(
                'flex h-full flex-col gap-2.5 rounded-2xl border p-4 md:flex-1',
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
                <span
                  className={cn(
                    'absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white',
                    accent.solid
                  )}
                >
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
                className={cn(
                  'hidden md:flex md:items-center md:self-center md:px-1',
                  accent.faint
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
