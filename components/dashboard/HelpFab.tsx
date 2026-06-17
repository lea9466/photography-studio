'use client'

import { HelpCircle } from 'lucide-react'

export function HelpFab() {
  return (
    <div className="fixed bottom-10 left-10 z-50">
      <button className="w-16 h-16 bg-[--foreground] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform hover:shadow-xl">
        <HelpCircle className="h-7 w-7" />
      </button>
    </div>
  )
}
