'use client'

import { Menu, X } from 'lucide-react'
import { Logo } from './Logo'

type MobileHeaderProps = {
  studioName?: string
  logoUrl?: string
  accentColor?: string
  shouldColorLogo?: boolean
  isMenuOpen?: boolean
  onToggleMenu?: () => void
}

export function MobileHeader({
  studioName,
  logoUrl,
  accentColor,
  shouldColorLogo,
  isMenuOpen = false,
  onToggleMenu,
}: MobileHeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-[--border]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-[--foreground]">
          <Logo
            logoUrl={logoUrl}
            accentColor={accentColor}
            shouldColorLogo={shouldColorLogo}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-[18px] font-bold text-[--foreground] leading-tight truncate">
            {studioName || 'Studio Gallery'}
          </h1>
          <span className="text-[10px] text-[--muted] uppercase tracking-wider">
            ניהול סטודיו
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleMenu}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[--border] bg-[--background] text-[--foreground] transition-colors hover:bg-[--dashboard-surface]"
        aria-label={isMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </header>
  )
}
