'use client'

import { CheckCircle } from 'lucide-react'

export function StatusSummaryCard() {
  return (
    <div className="bg-[--border]/30 p-6 rounded-xl border border-[--border] flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-700 dark:text-green-400">
          <CheckCircle className="h-6 w-6" fill="currentColor" />
        </div>
        <div>
          <p className="font-semibold text-[--foreground]">האתר שלך באוויר</p>
          <p className="text-sm text-[--muted]">כל השינויים מסונכרנים בזמן אמת לכתובת הציבורית שלך.</p>
        </div>
      </div>
      <button className="bg-white dark:bg-zinc-800 border border-[--border] text-[--foreground] px-5 py-2 rounded-xl text-sm font-medium hover:bg-[--border]/30 transition-colors">
        צפה באתר
      </button>
    </div>
  )
}
