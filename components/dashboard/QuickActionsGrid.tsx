'use client'

import Link from 'next/link'
import { Package, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

type QuickAction = {
  label: string
  icon: React.ReactNode
  href: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'ניהול חבילות',
    icon: <Package className="h-6 w-6" />,
    href: '/dashboard/packages',
  },
  {
    label: 'עריכת אתר',
    icon: <Edit className="h-6 w-6" />,
    href: '/dashboard/settings',
  },
]

export function QuickActionsGrid() {
  return (
    <div className="grid grid-cols-2 gap-2 mb-6 md:hidden animate-slide-up">
      {QUICK_ACTIONS.map((action, index) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            'bg-[--background] border border-[--border]',
            'p-4 rounded-xl',
            'shadow-sm transition-all active:scale-95 active:bg-[--border]/20 group',
            'hover:shadow-md hover:border-[#7D3A52]/30'
          )}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="text-[#7D3A52] group-hover:scale-110 transition-transform">
            {action.icon}
          </div>
          <span className="text-xs font-medium text-[--foreground]">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  )
}
