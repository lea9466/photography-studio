'use client'

import { Album, Pencil } from 'lucide-react'
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
    label: 'לאלבום',
    Icon: Album,
    active: 'bg-transparent text-rose-500 ring-rose-500',
  },
  edit: {
    label: 'לעיבוד',
    Icon: Pencil,
    active: 'bg-transparent text-amber-400 ring-amber-400',
  },
} as const

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all',
        'text-sm font-medium ring-1 hover:scale-105',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
        selected
          ? config.active
          : 'bg-transparent text-white ring-white/60 hover:ring-white',
        className
      )}
      aria-label={config.label}
      aria-pressed={selected}
    >
      <Icon className={SIZE_CLASSES[size]} strokeWidth={2} />
      {showLabel ? <span>{config.label}</span> : null}
    </button>
  )
}
