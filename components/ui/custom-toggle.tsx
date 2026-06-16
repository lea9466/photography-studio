'use client'

import { cn } from '@/lib/utils'

type CustomToggleProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function CustomToggle({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: CustomToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-8 w-14 items-center rounded-full border-2 border-[--border] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[--primary] border-[--primary]' : 'bg-[--muted]/30',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-6 w-6 rounded-full shadow-lg transition-transform',
          checked ? 'translate-x-7 bg-[--primary]' : 'translate-x-1 bg-gray-400'
        )}
      />
    </button>
  )
}
