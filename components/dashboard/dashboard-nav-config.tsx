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
  Layers,
} from 'lucide-react'

import type { ProFeature } from '@/lib/subscriptions/types'

/**
 * Which management area a sidebar tab belongs to. The sidebar renders one
 * labelled section per group ("ניהול גלריות פרטיות" / "ניהול אתר ציבורי").
 */
export type DashboardNavGroup = 'private' | 'public'

export type DashboardNavItem = {
  href: string
  label: string
  icon: React.ReactNode
  isActive: (pathname: string) => boolean
  group: DashboardNavGroup
  frozen?: boolean
  badge?: 'free' | 'new'
  /** Set for tabs whose destination page is a PRO-only feature — shows a lock + upgrade tooltip when the studio is FREE. */
  proFeature?: ProFeature
  /** Hover tooltip shown on the lock icon when the studio is FREE. Required alongside `proFeature`. */
  lockedTooltip?: string
}

/**
 * Section headers shown above each group of tabs, in render order. Both render
 * as the same purple pill (see DashboardNavMenu).
 */
export const DASHBOARD_NAV_GROUPS: { id: DashboardNavGroup; label: string }[] = [
  { id: 'private', label: 'ניהול גלריות פרטיות' },
  { id: 'public', label: 'ניהול אתר ציבורי' },
]

export const PUBLIC_ONLY_MVP = true

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: '/dashboard',
    label: 'לוח בקרה',
    icon: <LayoutDashboard className="h-5 w-5" />,
    isActive: (pathname) => pathname === '/dashboard',
    group: 'private',
    frozen: PUBLIC_ONLY_MVP,
  },
  {
    href: '/dashboard/clients',
    label: 'לקוחות',
    icon: <Users className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/clients'),
    group: 'private',
    frozen: PUBLIC_ONLY_MVP,
  },
  {
    href: '/dashboard/galleries',
    label: 'גלריות',
    icon: <ImageIcon className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/galleries'),
    group: 'public',
  },
  {
    href: '/dashboard/posts',
    label: 'פוסטים',
    icon: <FileText className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/posts'),
    group: 'public',
    proFeature: 'posts',
    lockedTooltip: 'פוסטים חסומים בגרסה החינמית — שדרגי לפרו כדי לכתוב ולפרסם פוסטים עם תמונות בבלוג ובדף הבית',
  },
  {
    href: '/dashboard/packages',
    label: 'חבילות צילום',
    icon: <Package className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/packages'),
    group: 'public',
    proFeature: 'packages',
    lockedTooltip: 'חבילות צילום חסומות בגרסה החינמית — שדרגי לפרו כדי להציג חבילות עם מחיר ורשימת מה כלול',
  },
  {
    href: '/dashboard/reviews',
    label: 'תגובות',
    icon: <MessageSquareQuote className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/reviews'),
    group: 'public',
    proFeature: 'testimonials',
    lockedTooltip: 'תגובות לקוחות חסומות בגרסה החינמית — שדרגי לפרו כדי להציג תגובות בדף הבית שלך',
  },
  {
    href: '/dashboard/photo-edits',
    label: 'לפני ואחרי עיבוד',
    icon: <Images className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/photo-edits'),
    group: 'public',
    proFeature: 'before_after',
    lockedTooltip: 'לפני ואחרי עיבוד חסום בגרסה החינמית — שדרגי לפרו כדי להציג ללקוחות את ההבדל בין התמונה המקורית לתוצאה המעובדת',
  },
  {
    href: '/dashboard/faq',
    label: 'שאלות נפוצות',
    icon: <CircleHelp className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/faq'),
    group: 'public',
    proFeature: 'faq',
    lockedTooltip: 'שאלות נפוצות חסומות בגרסה החינמית — שדרגי לפרו כדי להציג סקשן שאלות נפוצות בדף הבית הציבורי שלך',
  },
  {
    href: '/dashboard/settings',
    label: 'הגדרות אתר',
    icon: <Settings className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/settings'),
    group: 'public',
  },
  {
    href: '/dashboard/custom-domain',
    label: 'דומיין אישי',
    icon: <Globe className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/custom-domain'),
    group: 'public',
    badge: 'new',
    proFeature: 'custom_domain',
    lockedTooltip: 'דומיין אישי לא כלול בתקופת הניסיון — שדרגי למנוי, או פתחי רק אותו בנפרד בתוספת חד-פעמית של ₪99, בלי מנוי מלא',
  },
  {
    href: '/dashboard/subscription',
    label: 'מינוי',
    icon: <CreditCard className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/subscription'),
    group: 'public',
    badge: 'free',
  },
  {
    href: '/dashboard/contact',
    label: 'יצירת קשר',
    icon: <Mail className="h-5 w-5" />,
    isActive: (pathname) => pathname.startsWith('/dashboard/contact'),
    group: 'public',
  },
]

export type DashboardNavContext = {
  /** Whether the private client-gallery flow is available to this account. */
  canCreateClientGalleries: boolean
}

/** Frozen ("בקרוב") during MVP — unfrozen only for the bypass account. */
const MVP_FROZEN_HREFS = new Set(['/dashboard', '/dashboard/clients'])

/**
 * The nav items to render for a given account. When private client galleries
 * are available (the MVP bypass account) the single "גלריות" item splits into
 * two distinct sidebar entries — a lock-marked "גלריות פרטיות" and, below it,
 * "גלריות ציבוריות" — that point at their own list pages, and the otherwise
 * frozen "לוח בקרה" / "לקוחות" tabs are unfrozen. Otherwise the base list is
 * returned unchanged.
 *
 * Every item carries a `group` (`private` / `public`); the sidebar renders one
 * labelled section per {@link DASHBOARD_NAV_GROUPS} entry.
 */
export function getDashboardNavItems({
  canCreateClientGalleries,
}: DashboardNavContext): DashboardNavItem[] {
  if (!canCreateClientGalleries) return DASHBOARD_NAV_ITEMS

  return DASHBOARD_NAV_ITEMS.flatMap((item) => {
    if (MVP_FROZEN_HREFS.has(item.href)) return [{ ...item, frozen: false }]
    if (item.href !== '/dashboard/galleries') return [item]
    return [
      {
        href: '/dashboard/private-galleries',
        label: 'גלריות פרטיות',
        icon: <Lock className="h-5 w-5" />,
        isActive: (pathname: string) =>
          pathname.startsWith('/dashboard/private-galleries'),
        group: 'private',
      },
      {
        href: '/dashboard/usage-packages',
        label: 'חבילות שימוש',
        icon: <Layers className="h-5 w-5" />,
        isActive: (pathname: string) =>
          pathname.startsWith('/dashboard/usage-packages'),
        group: 'private',
      },
      { ...item, label: 'גלריות ציבוריות' },
    ]
  })
}
