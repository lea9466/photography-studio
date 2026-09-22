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

// Both types share the studio's brand colour when active — the icon + label
// (always shown, see showLabel on every call site) already distinguish album
// from edit, so the colour doesn't need to carry that distinction too.
const ACTIVE_CLASS = 'bg-transparent text-accent ring-accent'

const TYPE_CONFIG = {
  album: {
    label: 'לאלבום',
    Icon: Album,
    active: ACTIVE_CLASS,
  },
  edit: {
    label: 'לעיבוד',
    Icon: Pencil,
    active: ACTIVE_CLASS,
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
