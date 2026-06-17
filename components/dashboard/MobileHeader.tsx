'use client'

import Image from 'next/image'

type MobileHeaderProps = {
  studioName?: string
  logoUrl?: string
}

export function MobileHeader({ studioName, logoUrl }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex items-center gap-3 w-full px-4 py-3 bg-white dark:bg-zinc-900 fixed top-0 z-50 border-b border-[--border]">
      {logoUrl ? (
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image
            src={logoUrl}
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
      ) : (
        <div className="h-10 w-10 flex-shrink-0 bg-[--border]/30 rounded-lg flex items-center justify-center">
          <span className="text-[--muted] text-sm font-bold">
            {studioName?.charAt(0) || 'S'}
          </span>
        </div>
      )}
      <div className="flex flex-col">
        <h1 className="text-[18px] font-bold text-[--foreground] leading-tight">
          {studioName || 'Studio Gallery'}
        </h1>
        <span className="text-[10px] text-[--muted] uppercase tracking-wider">
          ניהול סטודיו
        </span>
      </div>
    </header>
  )
}
