'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function SettingsHeader() {
  const [isSaving, setIsSaving] = useState(false)

  function handleSave() {
    setIsSaving(true)
    // Simulate save - in real implementation this would trigger the form save
    setTimeout(() => {
      setIsSaving(false)
      toast.success('השינויים נשמרו')
    }, 1200)
  }

  return (
    <header className="sticky top-0 w-full z-40 bg-white dark:bg-zinc-900 border-b border-[--border] flex flex-row-reverse justify-between items-center px-6 md:px-10 py-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[--foreground] text-white px-6 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>
      <div className="text-right">
        <h1 className="text-2xl font-bold text-[--foreground] tracking-tight">הגדרות אתר</h1>
        <p className="text-sm text-[--muted] mt-1">ניהול זהות המותג ותוכן האתר שלך</p>
      </div>
    </header>
  )
}
