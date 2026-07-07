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
  accentColor,
  shouldColorLogo,
}: SidebarNavProps) {
  return (
    <aside
      className={cn(
        'fixed right-0 top-0 h-full bg-[--dashboard-background] z-40 flex-col border-l border-[--dashboard-border] hidden md:flex transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-72'
      )}
    >
      <button
        onClick={onToggleCollapse}
        className={cn(
          'absolute p-2 rounded-lg bg-[--dashboard-surface] border border-[--dashboard-border] shadow-md hover:bg-[--dashboard-accent]/10 transition-all duration-200 flex items-center justify-center',
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
          'p-6 flex items-center gap-4 transition-all duration-300',
          isCollapsed ? 'opacity-0 w-0 overflow-hidden p-0' : 'opacity-100'
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-[--dashboard-foreground] flex items-center justify-center text-white overflow-hidden border border-[--dashboard-border]">
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
          'flex-1 mt-4 px-4 transition-all duration-300 min-h-0 overflow-y-auto',
          isCollapsed ? 'opacity-0 w-0 overflow-hidden px-0' : 'opacity-100'
        )}
      >
        <DashboardNavMenu />
      </div>

      <div
        className={cn(
          'mt-auto border-t border-[--dashboard-border] transition-all duration-300 space-y-3',
          isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-4'
        )}
      >
        {!isCollapsed && portfolioSlug ? (
          <a
            href={`/${portfolioSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[--dashboard-accent]/10 text-[--dashboard-accent] font-semibold border border-[--dashboard-accent]/20 hover:bg-[--dashboard-accent]/20 transition-all duration-200"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="text-sm">צפי באתר שלי</span>
          </a>
        ) : null}

        {isCollapsed ? (
          <div className="w-10 h-10 rounded-full bg-[--dashboard-accent]/10 flex items-center justify-center text-[--dashboard-accent] font-semibold border border-[--dashboard-border]">
            {userName?.charAt(0) || 'U'}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[--dashboard-accent]/10 flex items-center justify-center text-[--dashboard-accent] font-semibold border border-[--dashboard-border]">
              {userName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[--dashboard-foreground]">
                {userName || 'משתמש'}
              </p>
              <p className="text-xs text-[--dashboard-accent] font-medium">מחובר</p>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-2 rounded-lg hover:bg-red-50 text-[--dashboard-muted] hover:text-red-600 transition-colors"
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
