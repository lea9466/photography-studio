'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  FileText,
  AlertCircle,
  Send,
  Archive
} from 'lucide-react'

type StatCardProps = {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  variant?: 'default' | 'urgent'
  isActive?: boolean
  onClick?: () => void
  badge?: string
  badgeColor?: string
}

function StatCard({ title, value, subtitle, icon, variant = 'default', isActive = false, onClick, badge, badgeColor }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        'bg-white dark:bg-zinc-900 border border-[--border] rounded-xl hover:shadow-sm transition-all cursor-pointer relative',
        variant === 'urgent' && 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
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
        <span className={cn('absolute top-0 left-0 opacity-60', variant === 'urgent' && 'text-rose-600 dark:text-rose-400')}>
          {icon}
        </span>

        {/* Content stacked neatly and aligned to the right */}
        <div className="pr-2"> {/* Optional right padding to match design */}
          <span className="text-sm text-[--muted] block">{title}</span>
          
          <div className="mt-4">
            <p className="text-[32px] font-bold text-[--foreground] leading-none mb-1">{value}</p>
            <p className={cn('text-[12px]', variant === 'urgent' ? 'text-rose-700 dark:text-rose-300 font-medium' : 'text-[--muted]')}>
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
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-bold',
              badgeColor || 'bg-gray-100 text-gray-700'
            )}>
              {badge}
            </span>
          )}
        </div>
        {/* Left side: Icon */}
        <div className={cn(
          'flex items-center justify-center',
          variant === 'urgent' ? 'text-[#7D3A52]' : 'text-[--muted]'
        )}>
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
  waiting?: number
  sent?: number
  expired?: number
  activeFilter?: string
  onFilterChange?: (filter: string) => void
}

export function StatsCards({ 
  drafts = 0, 
  waiting = 0, 
  sent = 0, 
  expired = 0,
  activeFilter = 'all',
  onFilterChange 
}: StatsCardsProps) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-6 md:mb-8">
      <StatCard
        title="טיוטות"
        value={drafts}
        subtitle="גלריות בתהליך"
        icon={<FileText className="h-6 w-6" />}
        isActive={activeFilter === 'draft'}
        onClick={() => onFilterChange?.('draft')}
        badge="טיוטה"
        badgeColor="bg-orange-100 text-orange-700"
      />
      <StatCard
        title="נשלחו ללקוחות"
        value={sent}
        subtitle="החודש האחרון"
        icon={<Send className="h-6 w-6" />}
        isActive={activeFilter === 'sent'}
        onClick={() => onFilterChange?.('selection')}
        badge="נשלח"
        badgeColor="bg-green-100 text-green-700"
      />
      <StatCard
        title="ממתינות לעיבוד"
        value={waiting}
        subtitle="דורש תשומת לב מיידית"
        icon={<AlertCircle className="h-6 w-6" />}
        variant="urgent"
        isActive={activeFilter === 'waiting'}
        onClick={() => onFilterChange?.('waiting')}
        badge="ממתין"
        badgeColor="bg-pink-100 text-pink-700"
      />
      <StatCard
        title="ארכיון"
        value={expired}
        subtitle="גלריות שפג תוקפן"
        icon={<Archive className="h-6 w-6" />}
        isActive={activeFilter === 'expired'}
        onClick={() => onFilterChange?.('expired')}
      />
    </section>
  )
}
