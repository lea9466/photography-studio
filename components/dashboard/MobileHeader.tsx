'use client'

import { Logo } from './Logo'

type MobileHeaderProps = {
  studioName?: string
  logoUrl?: string
  accentColor?: string
  shouldColorLogo?: boolean
}

export function MobileHeader({ studioName, logoUrl, accentColor, shouldColorLogo }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex items-center gap-3 w-full px-4 py-3 bg-white dark:bg-zinc-900 fixed top-0 z-50 border-b border-[--border]">
      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center">
        <Logo 
          logoUrl={logoUrl}
          accentColor={accentColor}
          shouldColorLogo={shouldColorLogo}
        />
      </div>
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
