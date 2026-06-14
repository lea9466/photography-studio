import * as React from 'react'
import { cn } from '@/lib/utils'

type StepperProps = {
  steps: string[]
  currentStep: number
  className?: string
}

function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn('flex flex-wrap gap-2', className)}>
      {steps.map((label, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isComplete = stepNumber < currentStep

        return (
          <li
            key={label}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              isActive
                ? 'border-[--accent] bg-[--background] text-[--foreground]'
                : isComplete
                  ? 'border-[--border] text-[--foreground]'
                  : 'border-[--border] text-[--muted]'
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                isActive || isComplete
                  ? 'bg-[--accent] text-[--background]'
                  : 'bg-[--background] text-[--muted]'
              )}
            >
              {stepNumber}
            </span>
            <span>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper }
