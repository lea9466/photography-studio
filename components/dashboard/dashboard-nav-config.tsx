import {
  LayoutDashboard,
  Image as ImageIcon,
  Users,
  Package,
  Settings,
  MessageSquareQuote,
  CircleHelp,
} from 'lucide-react'

export type DashboardNavItem = {
  href: string
  label: string
  icon: React.ReactNode
  isActive: (pathname: string) => boolean
  frozen?: boolean
}

export const PUBLIC_ONLY_MVP = true

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
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
