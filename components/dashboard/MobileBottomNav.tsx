'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  Image as ImageIcon,
  Package,
  Settings
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
    label: 'ראשי',
    icon: <LayoutDashboard className="h-6 w-6" />,
    isActive: (pathname) => pathname === '/dashboard',
  },
  {
    href: '/dashboard/galleries',
    label: 'גלריות',
    icon: <ImageIcon className="h-6 w-6" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/galleries'),
  },
  {
    href: '/dashboard/packages',
    label: 'חבילות',
    icon: <Package className="h-6 w-6" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/packages'),
  },
  {
    href: '/dashboard/settings',
    label: 'הגדרות',
    icon: <Settings className="h-6 w-6" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/settings'),
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 md:hidden bg-[--background] border-t border-[--border]/30 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      {NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center transition-colors',
              active
                ? 'text-[#7D3A52]'
                : 'text-[--muted] hover:text-[--foreground]'
            )}
          >
            {item.icon}
            <span className="text-[11px] mt-1 font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
