'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Menu, X, LogOut, ExternalLink } from 'lucide-react'
import { Logo } from './Logo'
import { DashboardNavMenu } from './DashboardNavMenu'

type MobileHeaderProps = {
  studioName?: string
  logoUrl?: string
  accentColor?: string
  shouldColorLogo?: boolean
  userName?: string
  portfolioSlug?: string | null
  onSignOut?: () => void
}

export function MobileHeader({
  studioName,
  logoUrl,
  accentColor,
  shouldColorLogo,
  userName,
  portfolioSlug,
  onSignOut,
}: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  function closeMenu() {
    setIsOpen(false)
  }

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-[--border]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center">
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
          onClick={() => setIsOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[--border] bg-[--background] text-[--foreground] transition-colors hover:bg-[--dashboard-surface]"
          aria-label={isOpen ? 'סגור תפריט' : 'פתח תפריט'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {isOpen ? (
        <button
          type="button"
          aria-label="סגור תפריט"
          className="md:hidden fixed inset-0 top-[65px] z-40 bg-black"
          onClick={closeMenu}
        />
      ) : null}

      <aside
        className={cn(
          'md:hidden fixed top-[65px] right-0 z-50 h-[calc(100vh-65px)] w-72 max-w-[85vw] bg-white border-l border-[--dashboard-border] flex flex-col transition-transform duration-300 ease-in-out shadow-xl',
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-white">
          <DashboardNavMenu onNavigate={closeMenu} />
        </div>

        <div className="border-t border-[--dashboard-border] p-4 space-y-3 bg-white">
          {portfolioSlug ? (
            <a
              href={`/${portfolioSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[--dashboard-accent]/10 text-[--dashboard-accent] font-semibold border border-[--dashboard-accent]/20 hover:bg-[--dashboard-accent]/20 transition-all duration-200"
            >
              <ExternalLink className="h-5 w-5" />
              <span className="text-sm">צפי באתר שלי</span>
            </a>
          ) : null}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[--dashboard-accent]/10 flex items-center justify-center text-[--dashboard-accent] font-semibold border border-[--dashboard-border]">
              {userName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[--dashboard-foreground] truncate">
                {userName || 'משתמש'}
              </p>
              <p className="text-xs text-[--dashboard-accent] font-medium">מחובר</p>
            </div>
            {onSignOut ? (
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  onSignOut()
                }}
                className="p-2 rounded-lg hover:bg-red-50 text-[--dashboard-muted] hover:text-red-600 transition-colors"
                aria-label="התנתקות"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  )
}
