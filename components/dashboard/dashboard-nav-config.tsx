'use client'

import {
  LayoutDashboard,
  Image as ImageIcon,
  Users,
  Package,
  Settings,
  MessageSquareQuote,
  CircleHelp,
  Mail,
  CreditCard,
  FileText,
  Images,
  Lock,
  Globe,
} from 'lucide-react'

import type { ProFeature } from '@/lib/subscriptions/types'

export type DashboardNavItem = {
  href: string
  label: string
  icon: React.ReactNode
  isActive: (pathname: string) => boolean
  frozen?: boolean
  badge?: 'free' | 'new'
  /** Set for tabs whose destination page is a PRO-only feature — shows a lock + upgrade tooltip when the studio is FREE. */
  proFeature?: ProFeature
  /** Hover tooltip shown on the lock icon when the studio is FREE. Required alongside `proFeature`. */
  lockedTooltip?: string
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
    href: '/dashboard/posts',
    label: 'פוסטים',
    icon: <FileText className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/posts'),
    proFeature: 'posts',
    lockedTooltip: 'פוסטים חסומים בגרסה החינמית — שדרגי לפרו כדי לכתוב ולפרסם פוסטים עם תמונות בבלוג ובדף הבית',
  },
  {
    href: '/dashboard/packages',
    label: 'חבילות צילום',
    icon: <Package className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/packages'),
    proFeature: 'packages',
    lockedTooltip: 'חבילות צילום חסומות בגרסה החינמית — שדרגי לפרו כדי להציג חבילות עם מחיר ורשימת מה כלול',
  },
  {
    href: '/dashboard/reviews',
    label: 'תגובות',
    icon: <MessageSquareQuote className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/reviews'),
    proFeature: 'testimonials',
    lockedTooltip: 'תגובות לקוחות חסומות בגרסה החינמית — שדרגי לפרו כדי להציג תגובות בדף הבית שלך',
  },
  {
    href: '/dashboard/photo-edits',
    label: 'לפני ואחרי עיבוד',
    icon: <Images className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/photo-edits'),
    proFeature: 'before_after',
    lockedTooltip: 'לפני ואחרי עיבוד חסום בגרסה החינמית — שדרגי לפרו כדי להציג ללקוחות את ההבדל בין התמונה המקורית לתוצאה המעובדת',
  },
  {
    href: '/dashboard/faq',
    label: 'שאלות נפוצות',
    icon: <CircleHelp className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/faq'),
    proFeature: 'faq',
    lockedTooltip: 'שאלות נפוצות חסומות בגרסה החינמית — שדרגי לפרו כדי להציג סקשן שאלות נפוצות בדף הבית הציבורי שלך',
  },
  {
    href: '/dashboard/settings',
    label: 'הגדרות אתר',
    icon: <Settings className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/settings'),
  },
  {
    href: '/dashboard/custom-domain',
    label: 'דומיין אישי',
    icon: <Globe className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/custom-domain'),
    badge: 'new',
    proFeature: 'custom_domain',
    lockedTooltip: 'דומיין אישי לא כלול בתקופת הניסיון — שדרגי למנוי, או פתחי רק אותו בנפרד בתוספת חד-פעמית של ₪99, בלי מנוי מלא',
  },
  {
    href: '/dashboard/subscription',
    label: 'מינוי',
    icon: <CreditCard className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/subscription'),
    badge: 'free',
  },
  {
    href: '/dashboard/contact',
    label: 'יצירת קשר',
    icon: <Mail className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/contact'),
  },
]

export type DashboardNavContext = {
  /** Whether the private client-gallery flow is available to this account. */
  canCreateClientGalleries: boolean
}

/**
 * The nav items to render for a given account. When private client galleries
 * are available the single "גלריות" item splits into two distinct sidebar
 * entries — "גלריות ציבוריות" and a lock-marked "גלריות פרטיות" — that point
 * at their own list pages. Otherwise the base list is returned unchanged.
 */
export function getDashboardNavItems({
  canCreateClientGalleries,
}: DashboardNavContext): DashboardNavItem[] {
  if (!canCreateClientGalleries) return DASHBOARD_NAV_ITEMS

  return DASHBOARD_NAV_ITEMS.flatMap((item) => {
    if (item.href !== '/dashboard/galleries') return [item]
    return [
      { ...item, label: 'גלריות ציבוריות' },
      {
        href: '/dashboard/private-galleries',
        label: 'גלריות פרטיות',
        icon: <Lock className="h-5 w-5" />,
        isActive: (pathname: string) =>
          pathname.startsWith('/dashboard/private-galleries'),
      },
    ]
  })
}
