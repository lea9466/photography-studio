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
  LogOut
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  isActive: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'לוח בקרה',
    icon: <LayoutDashboard className="h-5 w-5" />,
    isActive: (pathname) => pathname === '/dashboard',
  },
  {
    href: '/dashboard/galleries',
    label: 'גלריות',
    icon: <ImageIcon className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/galleries'),
  },
  {
    href: '/dashboard/clients',
    label: 'לקוחות',
    icon: <Users className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/clients'),
  },
  {
    href: '/dashboard/packages',
    label: 'חבילות צילום',
    icon: <Package className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/packages'),
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
  onSignOut?: () => void
}

export function SidebarNav({ userName, studioName, logoUrl, onSignOut }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed right-0 top-0 h-full w-72 bg-white dark:bg-zinc-900 z-40 flex flex-col border-l border-[--border] hidden md:flex">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[--foreground] flex items-center justify-center text-white overflow-hidden border border-[--border]">
          {logoUrl ? (
            <img 
              alt="Logo" 
              className="w-full h-full object-cover" 
              src={logoUrl}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl">📷</span>
            </div>
          )}
        </div>
        <div>
          <h2 className="font-semibold text-lg text-[--foreground]">
            {studioName || 'סטודיו לצילום'}
          </h2>
          <p className="text-sm text-[--muted]">ניהול מערכת</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                active
                  ? 'bg-[--accent]/10 text-[--accent] font-semibold border-r-4 border-[--accent] pr-3'
                  : 'text-[--muted] hover:text-[--foreground] hover:bg-[--background] pr-4'
              )}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="mt-auto p-4 border-t border-[--border]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[--accent]/10 flex items-center justify-center text-[--accent] font-semibold border border-[--border]">
            {userName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[--foreground]">{userName || 'משתמש'}</p>
            <p className="text-xs text-[--accent] font-medium">מחובר</p>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg hover:bg-red-50 text-[--muted] hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
