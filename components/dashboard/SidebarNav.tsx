'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Menu, X, LogOut, ExternalLink, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Logo } from './Logo'
import { DashboardNavMenu } from './DashboardNavMenu'
import { updateSiteUnderConstruction } from '@/lib/actions/site-settings.actions'

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
  siteUnavailableLocked?: boolean
  isUnderConstruction?: boolean
  isPro?: boolean
  onOpenAssistant?: () => void
  assistantHasMissingContent?: boolean
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
  siteUnavailableLocked = false,
  isUnderConstruction = false,
  isPro = true,
  onOpenAssistant,
  assistantHasMissingContent = false,
}: SidebarNavProps) {
  const showExpanded = isMobileOpen || !isCollapsed
  const [underConstruction, setUnderConstruction] = useState(isUnderConstruction)
  const [visibilityPending, startVisibilityTransition] = useTransition()

  useEffect(() => {
    setUnderConstruction(isUnderConstruction)
  }, [isUnderConstruction])

  function handleVisibilityToggle() {
    if (siteUnavailableLocked || visibilityPending) return
    const next = !underConstruction
    startVisibilityTransition(async () => {
      try {
        await updateSiteUnderConstruction(next)
        setUnderConstruction(next)
        toast.success(
          next
            ? 'האתר הוסתר מצפייה ציבורית'
            : 'האתר פתוח לצפייה ציבורית'
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'עדכון נכשל')
      }
    })
  }

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
        <DashboardNavMenu
          onNavigate={onMobileClose}
          siteUnavailableLocked={siteUnavailableLocked}
          isPro={isPro}
        />
      </div>

      <div
        className={cn(
          'mt-auto border-t border-[--dashboard-border] transition-all duration-300 space-y-3 max-md:bg-white',
          showExpanded ? 'p-4' : 'p-2 flex flex-col items-center gap-2'
        )}
      >
        {showExpanded ? (
          <div className="space-y-2">
            {portfolioSlug ? (
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
            {onOpenAssistant ? (
              <button
                type="button"
                onClick={() => {
                  onMobileClose?.()
                  onOpenAssistant()
                }}
                className="relative flex w-full items-center gap-3 rounded-xl border border-[--dashboard-border] bg-[--dashboard-surface] px-4 py-3 text-right text-[--dashboard-muted] transition-all duration-200 hover:bg-[--dashboard-surface] hover:text-[--dashboard-foreground]"
              >
                <Sparkles className="h-5 w-5 shrink-0 text-amber-500" />
                <span className="text-sm font-medium">עוזר האתר</span>
                {assistantHasMissingContent ? (
                  <span className="absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-500" />
                ) : null}
              </button>
            ) : null}
            {!siteUnavailableLocked ? (
              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled={visibilityPending}
                  onClick={handleVisibilityToggle}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all duration-200',
                    underConstruction
                      ? 'border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100'
                      : 'border-[--dashboard-border] bg-[--dashboard-surface] text-[--dashboard-muted] hover:text-[--dashboard-foreground] hover:bg-[--dashboard-surface]'
                  )}
                >
                  {underConstruction ? (
                    <EyeOff className="h-5 w-5 shrink-0" />
                  ) : (
                    <Eye className="h-5 w-5 shrink-0" />
                  )}
                  <span className="text-sm font-medium leading-snug">
                    {visibilityPending
                      ? 'מעדכן...'
                      : underConstruction
                        ? 'האתר מוסתר מצפייה — לחצי לפתיחה'
                        : 'הסתירי את האתר מצפייה'}
                  </span>
                </button>
                {underConstruction ? (
                  <p className="px-1 text-[11px] leading-relaxed text-orange-800/80">
                    אצלך בדפדפן הזה האתר פתוח. בדפדפן אחר — חסום.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
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
