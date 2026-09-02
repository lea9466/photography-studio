'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  FileText,
  AlertCircle,
  Send,
  Truck,
  Archive
} from 'lucide-react'

/**
 * Each card is tinted with its gallery-status colour so the overview reads the
 * same as the status badges in RecentGalleriesTable (getStatusBadge):
 *   draft → slate · selection → rose · editing → amber ·
 *   delivery_ready → blue · locked/expired → purple
 */
type Tone = 'slate' | 'rose' | 'amber' | 'blue' | 'purple'

const TONE_STYLES: Record<Tone, { card: string; icon: string; subtitle: string; badge: string }> = {
  slate: {
    card: 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800',
    icon: 'text-slate-500 dark:text-slate-400',
    subtitle: 'text-slate-600 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
  rose: {
    card: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
    icon: 'text-rose-500 dark:text-rose-400',
    subtitle: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200',
  },
  amber: {
    card: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500 dark:text-amber-400',
    subtitle: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  blue: {
    card: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    subtitle: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  purple: {
    card: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
    icon: 'text-purple-500 dark:text-purple-400',
    subtitle: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
}

type StatCardProps = {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  tone: Tone
  /** Bold subtitle for the card that needs the photographer's action now. */
  emphasis?: boolean
  isActive?: boolean
  onClick?: () => void
  badge?: string
}

function StatCard({ title, value, subtitle, icon, tone, emphasis = false, isActive = false, onClick, badge }: StatCardProps) {
  const styles = TONE_STYLES[tone]
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        'border rounded-xl hover:shadow-sm transition-all cursor-pointer relative',
        styles.card,
        isActive && 'ring-2 ring-[--accent] ring-offset-2',

        // Mobile layout
        'flex flex-row items-center justify-between p-4 min-h-0',

        // Desktop layout override
        'md:flex-col md:justify-between md:p-6 md:min-h-[140px]'
      )}
    >
      {/* Desktop layout */}
      <div className="hidden md:block relative w-full text-right h-full">
        {/* Icon strictly positioned at the top-left corner */}
        <span className={cn('absolute top-0 left-0 opacity-60', styles.icon)}>
          {icon}
        </span>

        {/* Content stacked neatly and aligned to the right */}
        <div className="pr-2"> {/* Optional right padding to match design */}
          <span className="text-sm text-[--muted] block">{title}</span>

          <div className="mt-4">
            <p className="text-[32px] font-bold text-[--foreground] leading-none mb-1">{value}</p>
            <p className={cn('text-[12px]', styles.subtitle, emphasis && 'font-medium')}>
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div dir="rtl" className="flex md:hidden items-center justify-between w-full">
        {/* Right side: Text, Number, Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[--muted]">{title}</span>
          <span className="text-xl font-bold text-[--foreground] leading-none">{value}</span>
          {badge && (
            <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', styles.badge)}>
              {badge}
            </span>
          )}
        </div>
        {/* Left side: Icon */}
        <div className={cn('flex items-center justify-center', styles.icon)}>
          <div className="h-5 w-5">
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}

type StatsCardsProps = {
  drafts?: number
  selection?: number
  editing?: number
  deliveryReady?: number
  expired?: number
  activeFilter?: string
  onFilterChange?: (filter: string) => void
}

export function StatsCards({
  drafts = 0,
  selection = 0,
  editing = 0,
  deliveryReady = 0,
  expired = 0,
  activeFilter = 'all',
  onFilterChange
}: StatsCardsProps) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6 mb-6 md:mb-8">
      <StatCard
        title="טיוטות"
        value={drafts}
        subtitle="גלריות בתהליך"
        icon={<FileText className="h-6 w-6" />}
        tone="slate"
        isActive={activeFilter === 'draft'}
        onClick={() => onFilterChange?.('draft')}
        badge="טיוטה"
      />
      <StatCard
        title="ממתין לבחירה"
        value={selection}
        subtitle="נשלח ללקוח"
        icon={<Send className="h-6 w-6" />}
        tone="rose"
        isActive={activeFilter === 'selection'}
        onClick={() => onFilterChange?.('selection')}
        badge="בחירה"
      />
      <StatCard
        title="בעריכה"
        value={editing}
        subtitle="דורש תשומת לב מיידית"
        icon={<AlertCircle className="h-6 w-6" />}
        tone="amber"
        emphasis
        isActive={activeFilter === 'editing'}
        onClick={() => onFilterChange?.('editing')}
        badge="עריכה"
      />
      <StatCard
        title="מוכן למסירה"
        value={deliveryReady}
        subtitle="ממתין להורדת הלקוח"
        icon={<Truck className="h-6 w-6" />}
        tone="blue"
        isActive={activeFilter === 'delivery_ready'}
        onClick={() => onFilterChange?.('delivery_ready')}
        badge="מסירה"
      />
      <StatCard
        title="פג תוקף"
        value={expired}
        subtitle="גלריות שפג תוקפן"
        icon={<Archive className="h-6 w-6" />}
        tone="purple"
        isActive={activeFilter === 'expired'}
        onClick={() => onFilterChange?.('expired')}
        badge="ארכיב"
      />
    </section>
  )
}
