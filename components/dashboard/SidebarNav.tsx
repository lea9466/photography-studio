'use client'

import { cn } from '@/lib/utils'
import { Menu, X, LogOut, ExternalLink } from 'lucide-react'
import { Logo } from './Logo'
import { DashboardNavMenu } from './DashboardNavMenu'

type SidebarNavProps = {
  userName?: string
  studioName?: string
  logoUrl?: string | null
  portfolioSlug?: string | null
  onSignOut?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
  accentColor?: string
  shouldColorLogo?: boolean
}

export function SidebarNav({
  userName,
  studioName,
  logoUrl,
  portfolioSlug,
  onSignOut,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
  accentColor,
  shouldColorLogo,
}: SidebarNavProps) {
  const showExpanded = isMobileOpen || !isCollapsed

  return (
    <aside
      className={cn(
        'fixed right-0 z-50 flex flex-col border-l border-[--dashboard-border] transition-all duration-300 ease-in-out bg-[--dashboard-background]',
        'top-[65px] h-[calc(100vh-65px)] w-72 max-w-[85vw] shadow-xl',
        'max-md:top-0 max-md:h-dvh max-md:w-full max-md:max-w-none max-md:bg-white max-md:pt-[65px] max-md:border-none max-md:shadow-none',
        'md:top-0 md:h-full md:shadow-none md:z-40',
        isMobileOpen
          ? 'translate-x-0'
          : 'translate-x-full pointer-events-none md:translate-x-0 md:pointer-events-auto',
        isCollapsed ? 'md:w-16' : 'md:w-72'
      )}
    >
      <button
        onClick={onToggleCollapse}
        className={cn(
          'absolute p-2 rounded-lg bg-[--dashboard-surface] border border-[--dashboard-border] shadow-md hover:bg-[--dashboard-accent]/10 transition-all duration-200 items-center justify-center hidden md:flex',
          isCollapsed ? 'right-2 top-4' : 'left-4 top-4'
        )}
        aria-label={isCollapsed ? 'פתח תפריט' : 'סגור תפריט'}
      >
        {isCollapsed ? (
          <Menu className="h-5 w-5 text-[--dashboard-foreground]" />
        ) : (
          <X className="h-5 w-5 text-[--dashboard-foreground]" />
        )}
      </button>

      <div
        className={cn(
          'p-6 flex items-center gap-4 transition-all duration-300 max-md:bg-white',
          showExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden p-0'
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[--dashboard-border] bg-[--dashboard-foreground] text-white">
          <Logo
            logoUrl={logoUrl}
            accentColor={accentColor}
            shouldColorLogo={shouldColorLogo}
          />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-[--dashboard-foreground]">
            {studioName || 'סטודיו לצילום'}
          </h2>
          <p className="text-sm text-[--dashboard-muted]">ניהול מערכת</p>
        </div>
      </div>

      <div
        className={cn(
          'flex-1 mt-4 px-4 transition-all duration-300 min-h-0 overflow-y-auto max-md:bg-white',
          showExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden px-0'
        )}
      >
        <DashboardNavMenu onNavigate={onMobileClose} />
      </div>

      <div
        className={cn(
          'mt-auto border-t border-[--dashboard-border] transition-all duration-300 space-y-3 max-md:bg-white',
          showExpanded ? 'p-4' : 'p-2 flex flex-col items-center gap-2'
        )}
      >
        {showExpanded && portfolioSlug ? (
          <a
            href={`/${portfolioSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onMobileClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[--dashboard-accent]/10 text-[--dashboard-accent] font-semibold border border-[--dashboard-accent]/20 hover:bg-[--dashboard-accent]/20 transition-all duration-200"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="text-sm">צפי באתר שלי</span>
          </a>
        ) : null}

        {!showExpanded ? (
          <div className="w-10 h-10 rounded-full bg-[--dashboard-accent]/10 flex items-center justify-center text-[--dashboard-accent] font-semibold border border-[--dashboard-border]">
            {userName?.charAt(0) || 'U'}
          </div>
        ) : (
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
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onMobileClose?.()
                  onSignOut()
                }}
                className="p-2 rounded-lg hover:bg-red-50 text-[--dashboard-muted] hover:text-red-600 transition-colors"
                aria-label="התנתקות"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
