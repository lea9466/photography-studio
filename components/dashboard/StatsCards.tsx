'use client'

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
}

function StatCard({ title, value, subtitle, icon, variant = 'default', isActive = false, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-zinc-900 border border-[--border] rounded-xl p-6 flex flex-col justify-between min-h-[140px] hover:shadow-sm transition-all cursor-pointer',
        variant === 'urgent' && 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
        isActive && 'ring-2 ring-[--accent] ring-offset-2'
      )}
    >
      <div className="flex justify-between items-start">
        <span className="text-sm text-[--muted]">{title}</span>
        <span className={cn('opacity-60', variant === 'urgent' && 'text-rose-600 dark:text-rose-400')}>
          {icon}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-[--foreground]">{value}</p>
        <p className={cn('text-xs', variant === 'urgent' ? 'text-rose-700 dark:text-rose-300 font-medium' : 'text-[--muted]')}>
          {subtitle}
        </p>
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
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="טיוטות"
        value={drafts}
        subtitle="גלריות בתהליך"
        icon={<FileText className="h-5 w-5" />}
        isActive={activeFilter === 'draft'}
        onClick={() => onFilterChange?.('draft')}
      />
      <StatCard
        title="ממתינות לעיבוד"
        value={waiting}
        subtitle="דורש תשומת לב מיידית"
        icon={<AlertCircle className="h-5 w-5" />}
        variant="urgent"
        isActive={activeFilter === 'waiting'}
        onClick={() => onFilterChange?.('waiting')}
      />
      <StatCard
        title="נשלחו ללקוחות"
        value={sent}
        subtitle="החודש האחרון"
        icon={<Send className="h-5 w-5" />}
        isActive={activeFilter === 'sent'}
        onClick={() => onFilterChange?.('sent')}
      />
      <StatCard
        title="ארכיון"
        value={expired}
        subtitle="גלריות שפג תוקפן"
        icon={<Archive className="h-5 w-5" />}
        isActive={activeFilter === 'expired'}
        onClick={() => onFilterChange?.('expired')}
      />
    </section>
  )
}
