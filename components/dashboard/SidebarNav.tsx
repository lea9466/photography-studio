'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Image as ImageIcon,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  MessageSquareQuote,
  CircleHelp,
} from 'lucide-react'
import { Logo } from './Logo'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  isActive: (pathname: string) => boolean
  /** MVP: frozen nav items show a "בקרוב" tooltip and are not clickable */
  frozen?: boolean
}

// MVP: public-only — dashboard overview and client management are coming soon.
const PUBLIC_ONLY_MVP = true

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'לוח בקרה',
    icon: <LayoutDashboard className="h-5 w-5" />,
    isActive: (pathname) => pathname === '/dashboard',
    frozen: PUBLIC_ONLY_MVP,
  },
  {
    href: '/dashboard/clients',
    label: 'לקוחות',
    icon: <Users className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/clients'),
    frozen: PUBLIC_ONLY_MVP,
  },
  {
    href: '/dashboard/galleries',
    label: 'גלריות',
    icon: <ImageIcon className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/galleries'),
  },
  {
    href: '/dashboard/packages',
    label: 'חבילות צילום',
    icon: <Package className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/packages'),
  },
  {
    href: '/dashboard/reviews',
    label: 'תגובות',
    icon: <MessageSquareQuote className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/reviews'),
  },
  {
    href: '/dashboard/faq',
    label: 'שאלות נפוצות',
    icon: <CircleHelp className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/faq'),
  },
  {
    href: '/dashboard/settings',
    label: 'הגדרות אתר',
    icon: <Settings className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/settings'),
  },
]

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

export function SidebarNav({ userName, studioName, logoUrl, portfolioSlug, onSignOut, isCollapsed = false, onToggleCollapse, accentColor, shouldColorLogo }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <>
      <aside
        className={cn(
          "fixed right-0 top-0 h-full bg-[--dashboard-background] z-40 flex flex-col border-l border-[--dashboard-border] hidden md:flex transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-72"
        )}
      >
      {/* Toggle Button - Inside sidebar when open */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          "absolute p-2 rounded-lg bg-[--dashboard-surface] border border-[--dashboard-border] shadow-md hover:bg-[--dashboard-accent]/10 transition-all duration-200 flex items-center justify-center",
          isCollapsed ? "right-2 top-4" : "left-4 top-4"
        )}
        aria-label={isCollapsed ? 'פתח תפריט' : 'סגור תפריט'}
      >
        {isCollapsed ? (
          <Menu className="h-5 w-5 text-[--dashboard-foreground]" />
        ) : (
          <X className="h-5 w-5 text-[--dashboard-foreground]" />
        )}
      </button>

      {/* Logo Section */}
      <div className={cn(
        "p-6 flex items-center gap-4 transition-all duration-300",
        isCollapsed ? "opacity-0 w-0 overflow-hidden p-0" : "opacity-100"
      )}>
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

      {/* Navigation */}
      <nav className={cn(
        "flex-1 mt-4 px-4 space-y-1 transition-all duration-300",
        isCollapsed ? "opacity-0 w-0 overflow-hidden px-0" : "opacity-100"
      )}>
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname)

          if (item.frozen) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                className={cn(
                  'relative flex items-center gap-3 px-4 py-3 rounded-xl border border-[#c9c5cd] transition-all duration-200',
                  'opacity-40 cursor-not-allowed select-none',
                  'text-[--dashboard-muted] pr-4'
                )}
              >
                <span className="absolute top-1.5 left-2 rounded-full bg-[#79767d] px-2.5 py-0.5 text-[10px] font-semibold text-white leading-none">
                  בקרוב
                </span>
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </span>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                active
                  ? 'bg-[--dashboard-accent]/10 text-[--dashboard-accent] font-semibold border-r-4 border-[--dashboard-accent] pr-3'
                  : 'text-[--dashboard-muted] hover:text-[--dashboard-foreground] hover:bg-[--dashboard-surface] pr-4'
              )}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className={cn(
        "mt-auto border-t border-[--dashboard-border] transition-all duration-300",
        isCollapsed ? "p-2 flex justify-center" : "p-4"
      )}>
        {isCollapsed ? (
          <div className="w-10 h-10 rounded-full bg-[--dashboard-accent]/10 flex items-center justify-center text-[--dashboard-accent] font-semibold border border-[--dashboard-border]">
            {userName?.charAt(0) || 'U'}
          </div>
        ) : (
          <>
            {/* View My Site Button */}
            {portfolioSlug && (
              <a
                href={`/${portfolioSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[--dashboard-accent]/10 text-[--dashboard-accent] font-semibold border border-[--dashboard-accent]/20 hover:bg-[--dashboard-accent]/20 transition-all duration-200 mb-3"
              >
                <ExternalLink className="h-5 w-5" />
                <span className="text-sm">צפי באתר שלי</span>
              </a>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[--dashboard-accent]/10 flex items-center justify-center text-[--dashboard-accent] font-semibold border border-[--dashboard-border]">
                {userName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[--dashboard-foreground]">{userName || 'משתמש'}</p>
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
          </>
        )}
      </div>
    </aside>
    </>
  )
}
