'use client'

import { Heart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type SelectionType = 'album' | 'edit'

type SelectionToggleProps = {
  type: SelectionType
  selected: boolean
  disabled?: boolean
  onClick: () => void
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const TYPE_CONFIG = {
  album: {
    label: 'אלבום',
    Icon: Heart,
    idle: 'text-rose-400 hover:text-rose-300',
    active: 'text-rose-500',
    fill: 'fill-rose-500',
  },
  edit: {
    label: 'עיבוד',
    Icon: Sparkles,
    idle: 'text-amber-400 hover:text-amber-300',
    active: 'text-amber-400',
    fill: 'fill-amber-400',
  },
} as const

const SIZE_CLASSES = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
} as const

export function SelectionToggle({
  type,
  selected,
  disabled,
  onClick,
  showLabel = false,
  size = 'md',
  className,
}: SelectionToggleProps) {
  const config = TYPE_CONFIG[type]
  const Icon = config.Icon

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full p-1.5 transition-all',
        'hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50',
        'drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]',
        selected ? config.active : config.idle,
        className
      )}
      aria-label={config.label}
      aria-pressed={selected}
    >
      <Icon
        className={cn(
          SIZE_CLASSES[size],
          'transition-all',
          selected ? config.fill : 'fill-transparent'
        )}
        strokeWidth={selected ? 2.25 : 2}
      />
      {showLabel ? (
        <span className="text-sm font-medium">{config.label}</span>
      ) : null}
    </button>
  )
}
