'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowDownUp,
  Building2,
  CalendarPlus,
  Clock3,
  Construction,
  ExternalLink,
  Filter,
  Gift,
  Hash,
  Lock,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Video,
  X,
} from 'lucide-react'
import type { AdminStudioRow } from '@/lib/admin/queries'
import {
  adminLogout,
  deleteAdminStudio,
  updateAdminStudioSiteAccess,
  updateAdminStudioSubscriptionOverride,
} from '@/lib/actions/admin.actions'
import { resolveTierBadge } from '@/lib/subscriptions/entitlements'
import type { StudioEntitlements } from '@/lib/subscriptions/types'
import { daysUntilTrialEnd } from '@/lib/referral/referral-utils'
import { AdminBroadcastForm } from '@/components/admin/AdminBroadcastForm'
import { AdminCoverCardMaintenance } from '@/components/admin/AdminCoverCardMaintenance'
import { AdminGalleryOriginalsCleanup } from '@/components/admin/AdminGalleryOriginalsCleanup'
import { AdminEmailLookupForm } from '@/components/admin/AdminEmailLookupForm'
import { AnnouncementManagerForm } from '@/components/admin/AnnouncementManagerForm'
import { AdminStudioSummaryDialog } from '@/components/admin/AdminStudioSummaryDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type AdminStudioListProps = {
  studios: AdminStudioRow[]
  appBaseUrl: string
}

type SortKey = 'created' | 'last_visit' | 'visit_count'
type FilterKey = 'all' | 'active_today' | 'never_visited' | 'new_this_month'

const SORT_OPTIONS: {
  key: SortKey
  label: string
  icon: typeof Clock3
  activeClass: string
  idleClass: string
}[] = [
  {
    key: 'last_visit',
    label: 'ביקור אחרון',
    icon: Clock3,
    activeClass:
      'border-emerald-300 bg-emerald-500 text-white shadow-md shadow-emerald-500/25',
    idleClass:
      'border-emerald-200/80 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100',
  },
  {
    key: 'visit_count',
    label: 'מספר ביקורים',
    icon: Hash,
    activeClass:
      'border-violet-300 bg-violet-500 text-white shadow-md shadow-violet-500/25',
    idleClass:
      'border-violet-200/80 bg-violet-50 text-violet-800 hover:border-violet-300 hover:bg-violet-100',
  },
  {
    key: 'created',
    label: 'תאריך פתיחה',
    icon: CalendarPlus,
    activeClass: 'border-sky-300 bg-sky-500 text-white shadow-md shadow-sky-500/25',
    idleClass: 'border-sky-200/80 bg-sky-50 text-sky-800 hover:border-sky-300 hover:bg-sky-100',
  },
]

const FILTER_OPTIONS: {
  key: FilterKey
  label: string
  icon: typeof Users
  activeClass: string
  idleClass: string
}[] = [
  {
    key: 'all',
    label: 'הכל',
    icon: Users,
    activeClass: 'border-slate-300 bg-slate-700 text-white shadow-sm',
    idleClass: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
  {
    key: 'active_today',
    label: 'פעילים היום',
    icon: UserCheck,
    activeClass: 'border-emerald-300 bg-emerald-600 text-white shadow-sm',
    idleClass:
      'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100',
  },
  {
    key: 'never_visited',
    label: 'לא ביקרו',
    icon: UserX,
    activeClass: 'border-amber-300 bg-amber-500 text-white shadow-sm',
    idleClass:
      'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100',
  },
  {
    key: 'new_this_month',
    label: 'חדשים החודש',
    icon: Sparkles,
    activeClass: 'border-rose-300 bg-rose-500 text-white shadow-sm',
    idleClass: 'border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-300 hover:bg-rose-100',
  },
]

const ADMIN_TIMEZONE = 'Asia/Jerusalem'

function toDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ADMIN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function toMonthKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ADMIN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).format(date)
}

function calendarDayDiff(iso: string, now = new Date()): number {
  const visitKey = toDateKey(new Date(iso))
  const nowKey = toDateKey(now)
  const visitMs = Date.parse(`${visitKey}T12:00:00Z`)
  const nowMs = Date.parse(`${nowKey}T12:00:00Z`)
  return Math.round((nowMs - visitMs) / 86_400_000)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', {
    timeZone: ADMIN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeVisit(iso: string | null) {
  if (!iso) return 'מעולם לא ביקר'

  const diffDays = calendarDayDiff(iso)

  if (diffDays === 0) return 'היום'
  if (diffDays === 1) return 'אתמול'
  if (diffDays < 7) return `לפני ${diffDays} ימים`
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`
  return formatDate(iso)
}

function isToday(iso: string) {
  return toDateKey(new Date(iso)) === toDateKey(new Date())
}

function isThisMonth(iso: string) {
  return toMonthKey(new Date(iso)) === toMonthKey(new Date())
}

function matchesFilter(row: AdminStudioRow, filterKey: FilterKey) {
  if (filterKey === 'active_today') {
    return Boolean(row.last_dashboard_visit_at && isToday(row.last_dashboard_visit_at))
  }
  if (filterKey === 'never_visited') {
    return !row.last_dashboard_visit_at
  }
  if (filterKey === 'new_this_month') {
    return isThisMonth(row.created_at)
  }
  return true
}

function matchesSearch(row: AdminStudioRow, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const haystack = [row.email, row.studio_name, row.name, row.slug]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

function getRowAccentClass(studio: AdminStudioRow) {
  if (!studio.last_dashboard_visit_at) {
    return 'border-r-amber-400 bg-amber-50/30'
  }
  if (isToday(studio.last_dashboard_visit_at)) {
    return 'border-r-emerald-500 bg-emerald-50/35'
  }
  if (isThisMonth(studio.last_dashboard_visit_at)) {
    return 'border-r-sky-400 bg-sky-50/25'
  }
  return 'border-r-slate-200 bg-white'
}

function getTrialDaysBadgeClass(daysLeft: number) {
  if (daysLeft <= 0) {
    return 'border-rose-200 bg-rose-100 text-rose-800'
  }
  if (daysLeft <= 7) {
    return 'border-amber-200 bg-amber-100 text-amber-800'
  }
  return 'border-emerald-200 bg-emerald-100 text-emerald-800'
}

function getTierBadgeClass(badge: ReturnType<typeof resolveTierBadge>) {
  switch (badge) {
    case 'FORCED PRO':
      return 'border-emerald-300 bg-emerald-600 text-white'
    case 'PRO':
      return 'border-emerald-200 bg-emerald-100 text-emerald-800'
    case 'TRIAL':
      return 'border-sky-200 bg-sky-100 text-sky-800'
    case 'FORCED FREE':
      return 'border-rose-300 bg-rose-500 text-white'
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600'
  }
}

function TierBadge({ entitlements }: { entitlements: StudioEntitlements }) {
  const badge = resolveTierBadge(entitlements)
  const Icon = badge === 'FORCED PRO' ? ShieldCheck : badge === 'FORCED FREE' ? ShieldOff : badge === 'PRO' ? Sparkles : Lock
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getTierBadgeClass(badge)}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {badge}
    </span>
  )
}

export function AdminStudioList({ studios, appBaseUrl }: AdminStudioListProps) {
  const [rows, setRows] = useState(studios)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [accessPendingId, setAccessPendingId] = useState<string | null>(null)
  const [overridePendingId, setOverridePendingId] = useState<string | null>(null)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('last_visit')
  const [filterKey, setFilterKey] = useState<FilterKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedStudioId, setHighlightedStudioId] = useState<string | null>(null)
  const [logoutPending, startLogout] = useTransition()

  const stats = useMemo(() => {
    const visitedToday = rows.filter(
      (row) => row.last_dashboard_visit_at && isToday(row.last_dashboard_visit_at)
    ).length
    const visitedThisMonth = rows.filter(
      (row) => row.last_dashboard_visit_at && isThisMonth(row.last_dashboard_visit_at)
    ).length
    const neverVisited = rows.filter((row) => !row.last_dashboard_visit_at).length
    const totalVisits = rows.reduce((sum, row) => sum + row.dashboard_visit_count, 0)

    return {
      total: rows.length,
      newToday: rows.filter((row) => isToday(row.created_at)).length,
      newThisMonth: rows.filter((row) => isThisMonth(row.created_at)).length,
      visitedToday,
      visitedThisMonth,
      neverVisited,
      totalVisits,
    }
  }, [rows])

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) => matchesFilter(row, filterKey) && matchesSearch(row, searchQuery)
      ),
    [rows, filterKey, searchQuery]
  )

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows]

    copy.sort((a, b) => {
      if (sortKey === 'visit_count') {
        return b.dashboard_visit_count - a.dashboard_visit_count
      }

      if (sortKey === 'last_visit') {
        const aTime = a.last_dashboard_visit_at
          ? new Date(a.last_dashboard_visit_at).getTime()
          : 0
        const bTime = b.last_dashboard_visit_at
          ? new Date(b.last_dashboard_visit_at).getTime()
          : 0
        return bTime - aTime
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return copy
  }, [filteredRows, sortKey])

  async function handleDelete(studio: AdminStudioRow) {
    const label = studio.studio_name || studio.name || studio.email || studio.id
    const confirmed = window.confirm(
      `למחוק את הסטודיו "${label}"?\nפעולה זו בלתי הפיכה ותמחק את כל הנתונים: לקוחות, גלריות, תמונות, חבילות, המלצות וקבצים.`
    )
    if (!confirmed) return

    setPendingId(studio.id)
    try {
      await deleteAdminStudio(studio.id)
      setRows((current) => current.filter((row) => row.id !== studio.id))
      toast.success('הסטודיו נמחק')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'מחיקה נכשלה')
    } finally {
      setPendingId(null)
    }
  }

  async function handleSiteAccessToggle(
    studio: AdminStudioRow,
    field: 'is_under_construction' | 'is_site_unavailable'
  ) {
    const nextValue = !studio[field]
    setAccessPendingId(studio.id)
    try {
      const updated = await updateAdminStudioSiteAccess(studio.id, {
        [field]: nextValue,
      })
      setRows((current) =>
        current.map((row) =>
          row.id === studio.id
            ? {
                ...row,
                is_under_construction: updated.is_under_construction,
                is_site_unavailable: updated.is_site_unavailable,
              }
            : row
        )
      )
      if (field === 'is_under_construction') {
        toast.success(nextValue ? 'האתר סומן כבבניה' : 'סימון בבניה בוטל')
      } else {
        toast.success(nextValue ? 'האתר סומן כלא זמין' : 'סימון לא זמין בוטל')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'עדכון נכשל')
    } finally {
      setAccessPendingId(null)
    }
  }

  function handleLogout() {
    startLogout(async () => {
      await adminLogout()
      window.location.reload()
    })
  }

  async function handleOverrideChange(
    studio: AdminStudioRow,
    override: 'auto' | 'pro' | 'free'
  ) {
    setOverridePendingId(studio.id)
    try {
      const updated = await updateAdminStudioSubscriptionOverride(
        studio.id,
        override
      )
      setRows((current) =>
        current.map((row) =>
          row.id === studio.id
            ? {
                ...row,
                subscription_tier_override: updated.subscription_tier_override,
                tier: updated.tier,
                tier_source: updated.tier_source,
                entitlements: updated.entitlements,
              }
            : row
        )
      )
      const labels: Record<string, string> = {
        auto: 'רמת המנוי הוגדרה לאוטומטי',
        pro: 'הסטודיו נכפה ל-PRO',
        free: 'הסטודיו נכפה ל-FREE',
      }
      toast.success(labels[override])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'עדכון נכשל')
    } finally {
      setOverridePendingId(null)
    }
  }

  async function handleImpersonate(studio: AdminStudioRow) {
    setImpersonatingId(studio.id)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studio.id }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'התחברות כמנהל נכשלה')
      }

      window.location.href = '/dashboard/galleries'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'התחברות כמנהל נכשלה')
      setImpersonatingId(null)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md">
        <div className="bg-slate-800 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-200">
                Gallery Studio
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                ניהול סטודיואים
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                מעקב אחר פתיחת סטודיואים, ביקורים בדשבורד ופעולות ניהול מרכזיות
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={logoutPending}
              className="shrink-0 border-slate-500 bg-slate-700 text-white hover:bg-slate-600 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              {logoutPending ? 'יוצא...' : 'יציאה'}
            </Button>
          </div>
        </div>
        <div className="grid gap-3 border-t border-slate-200/80 bg-slate-50/70 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-slate-500 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">סה״כ סטודיואים</p>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Building2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.newThisMonth} נפתחו החודש · {stats.newToday} היום
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 border-r-4 border-r-emerald-500 bg-emerald-50/40 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-emerald-800">ביקרו היום</p>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <UserCheck className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-emerald-800">{stats.visitedToday}</p>
            <p className="mt-1 text-xs text-emerald-700/80">
              {stats.visitedThisMonth} ביקרו החודש
            </p>
          </div>

          <div className="rounded-2xl border border-violet-200/80 border-r-4 border-r-violet-500 bg-violet-50/40 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-violet-800">סה״כ ביקורים בדשבורד</p>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <LogIn className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-violet-800">{stats.totalVisits}</p>
            <p className="mt-1 text-xs text-violet-700/80">מכל הסטודיואים יחד</p>
          </div>

          <div className="rounded-2xl border border-amber-200/80 border-r-4 border-r-amber-500 bg-amber-50/40 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-amber-800">מעולם לא ביקרו</p>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-amber-800">{stats.neverVisited}</p>
            <p className="mt-1 text-xs text-amber-700/80">סטודיואים ללא ביקור בדשבורד</p>
          </div>
        </div>
      </div>

      <AnnouncementManagerForm />

      <AdminCoverCardMaintenance />

      <AdminGalleryOriginalsCleanup />

      <AdminEmailLookupForm
        onStudioFound={(studio) => {
          setFilterKey('all')
          setHighlightedStudioId(studio.id)
        }}
      />

      <AdminBroadcastForm />

      <Card className="overflow-hidden border-slate-200/80 shadow-md">
        <CardHeader className="space-y-5 border-b border-[--border]/70 bg-gradient-to-l from-slate-50 via-[--card] to-[--card]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">רשימת סטודיואים</CardTitle>
              <CardDescription className="mt-1">
                {sortedRows.length} מתוך {rows.length} סטודיואים מוצגים
              </CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <ArrowDownUp className="h-3.5 w-3.5" />
              ממוין לפי{' '}
              {sortKey === 'last_visit'
                ? 'ביקור אחרון'
                : sortKey === 'visit_count'
                  ? 'מספר ביקורים'
                  : 'תאריך פתיחה'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Search className="h-4 w-4 text-rose-600" />
              חיפוש
            </div>
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי מייל או שם סטודיו..."
                className="border-slate-200 bg-white pr-10 pl-10 focus-visible:ring-rose-300"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="נקה חיפוש"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Filter className="h-4 w-4 text-violet-600" />
              סינון
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => {
                const Icon = option.icon
                const isActive = filterKey === option.key

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilterKey(option.key)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all ${
                      isActive ? option.activeClass : option.idleClass
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <ArrowDownUp className="h-4 w-4 text-sky-600" />
              מיון
            </div>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => {
                const Icon = option.icon
                const isActive = sortKey === option.key

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSortKey(option.key)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive ? option.activeClass : option.idleClass
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto bg-slate-50/60 p-3 sm:p-4">
          <table className="w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr>
                <th className="rounded-r-xl bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-white">
                  סטודיו
                </th>
                <th className="bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-white">
                  אימייל
                </th>
                <th className="bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
                  סרטון הרו
                </th>
                <th className="bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  ביקור אחרונה
                </th>
                <th className="bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-violet-200">
                  ביקורים
                </th>
                <th className="bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-sky-200">
                  תאריך פתיחה
                </th>
                <th className="bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-amber-200">
                  ימים חינם
                </th>
                <th className="bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  רמת מנוי
                </th>
                <th className="bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-orange-200">
                  מצב אתר
                </th>
                <th className="rounded-l-xl bg-slate-800 px-2.5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-white">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center text-[--muted]">
                      אין סטודיואים שמתאימים לסינון הנוכחי
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRows.map((studio, index) => {
                  const siteUrl = studio.site_path
                    ? `${appBaseUrl}${studio.site_path}`
                    : null
                  const hasRecentVisit =
                    studio.last_dashboard_visit_at &&
                    isToday(studio.last_dashboard_visit_at)
                  const rowAccent = getRowAccentClass(studio)
                  const isHighlighted = highlightedStudioId === studio.id
                  const trialDaysLeft = daysUntilTrialEnd(studio.trial_end_date)

                  return (
                    <tr key={studio.id} className="group">
                      <td
                        className={`rounded-r-2xl border border-slate-200/80 border-r-4 px-2.5 py-3 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent} ${
                          isHighlighted ? 'ring-2 ring-sky-400 ring-offset-2' : ''
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">
                              {studio.studio_name || studio.name || '—'}
                            </div>
                            {studio.slug ? (
                              <div
                                className="mt-1 inline-flex max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                                dir="ltr"
                              >
                                /{studio.slug}
                              </div>
                            ) : null}
                            {(studio.is_under_construction || studio.is_site_unavailable) && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {studio.is_under_construction ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800">
                                    <Construction className="h-3 w-3" />
                                    בבניה
                                  </span>
                                ) : null}
                                {studio.is_site_unavailable ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                                    <ShieldOff className="h-3 w-3" />
                                    לא זמין
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`border-y border-slate-200/80 px-2.5 py-3 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent}`}
                        dir="ltr"
                      >
                        <span
                          className="block max-w-[160px] truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700"
                          title={studio.email || undefined}
                        >
                          {studio.email || '—'}
                        </span>
                      </td>
                      <td
                        className={`border-y border-slate-200/80 px-2.5 py-3 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent}`}
                      >
                        {studio.has_hero_video ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-200 bg-fuchsia-100 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-800">
                            <Video className="h-3 w-3 shrink-0" />
                            יש
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            <Video className="h-3 w-3 shrink-0 opacity-50" />
                            אין
                          </span>
                        )}
                      </td>
                      <td
                        className={`border-y border-slate-200/80 px-2.5 py-3 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent}`}
                      >
                        {studio.last_dashboard_visit_at ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className={
                                hasRecentVisit
                                  ? 'inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800'
                                  : 'inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600'
                              }
                            >
                              {formatRelativeVisit(studio.last_dashboard_visit_at)}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {formatDate(studio.last_dashboard_visit_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            לא ביקר
                          </span>
                        )}
                      </td>
                      <td
                        className={`border-y border-slate-200/80 px-2.5 py-3 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent}`}
                      >
                        <span
                          className={`inline-flex min-w-8 items-center justify-center rounded-lg border px-2 py-1 text-sm font-bold tabular-nums ${
                            studio.dashboard_visit_count > 10
                              ? 'border-violet-200 bg-violet-100 text-violet-800'
                              : studio.dashboard_visit_count > 0
                                ? 'border-sky-200 bg-sky-100 text-sky-800'
                                : 'border-slate-200 bg-slate-100 text-slate-500'
                          }`}
                        >
                          {studio.dashboard_visit_count}
                        </span>
                      </td>
                      <td
                        className={`border-y border-slate-200/80 px-2.5 py-3 whitespace-nowrap shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent}`}
                      >
                        <div className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                          <CalendarPlus className="h-3 w-3 shrink-0" />
                          {formatDate(studio.created_at)}
                        </div>
                      </td>
                      <td
                        className={`border-y border-slate-200/80 px-2.5 py-3 whitespace-nowrap shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent}`}
                      >
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${getTrialDaysBadgeClass(trialDaysLeft)}`}
                          >
                            <Gift className="h-3 w-3 shrink-0" />
                            {trialDaysLeft <= 0 ? 'פג' : `${trialDaysLeft} ימים`}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            עד {formatDate(studio.trial_end_date)}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`border-y border-slate-200/80 px-2.5 py-3 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent}`}
                      >
                        <div className="flex min-w-28 flex-col gap-1.5">
                          <TierBadge entitlements={studio.entitlements} />
                          <select
                            value={studio.subscription_tier_override}
                            disabled={overridePendingId === studio.id}
                            onChange={(event) =>
                              handleOverrideChange(
                                studio,
                                event.target.value as 'auto' | 'pro' | 'free'
                              )
                            }
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-medium text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                          >
                            <option value="auto">אוטומטי</option>
                            <option value="pro">Force PRO</option>
                            <option value="free">Force FREE</option>
                          </select>
                        </div>
                      </td>
                      <td
                        className={`border-y border-slate-200/80 px-2.5 py-3 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent}`}
                      >
                        <div className="flex flex-col gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={accessPendingId === studio.id}
                            onClick={() =>
                              handleSiteAccessToggle(studio, 'is_under_construction')
                            }
                            className={`h-8 px-2 text-[11px] ${
                              studio.is_under_construction
                                ? 'border-orange-300 bg-orange-500 text-white hover:bg-orange-600'
                                : 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100'
                            }`}
                          >
                            <Construction className="h-3 w-3" />
                            {studio.is_under_construction ? 'בבניה ✓' : 'בבניה'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={accessPendingId === studio.id}
                            onClick={() =>
                              handleSiteAccessToggle(studio, 'is_site_unavailable')
                            }
                            className={`h-8 px-2 text-[11px] ${
                              studio.is_site_unavailable
                                ? 'border-rose-300 bg-rose-500 text-white hover:bg-rose-600'
                                : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                            }`}
                          >
                            <ShieldOff className="h-3 w-3" />
                            {studio.is_site_unavailable ? 'לא זמין ✓' : 'לא זמין'}
                          </Button>
                        </div>
                      </td>
                      <td
                        className={`rounded-l-2xl border border-slate-200/80 px-2.5 py-3 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${rowAccent}`}
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap gap-1.5">
                            <AdminStudioSummaryDialog studio={studio} />
                            {siteUrl ? (
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-8 border-sky-200 bg-sky-50 px-2 text-[11px] text-sky-800 hover:bg-sky-100"
                              >
                                <Link href={siteUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                  לאתר
                                </Link>
                              </Button>
                            ) : (
                              <span className="self-center text-[11px] text-slate-400">אין אתר</span>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 border-violet-200 bg-violet-50 px-2 text-[11px] text-violet-800 hover:bg-violet-100"
                            disabled={impersonatingId === studio.id}
                            onClick={() => handleImpersonate(studio)}
                          >
                            {impersonatingId === studio.id ? 'נכנס...' : 'התחבר כמנהל'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="h-8 px-2 text-[11px]"
                            disabled={pendingId === studio.id}
                            onClick={() => handleDelete(studio)}
                          >
                            <Trash2 className="h-3 w-3" />
                            {pendingId === studio.id ? 'מוחק...' : 'מחק'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
