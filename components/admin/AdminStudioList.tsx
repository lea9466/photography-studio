'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Building2,
  CalendarPlus,
  ExternalLink,
  LogIn,
  LogOut,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react'
import type { AdminStudioRow } from '@/lib/admin/queries'
import { adminLogout, deleteAdminStudio } from '@/lib/actions/admin.actions'
import { AdminBroadcastForm } from '@/components/admin/AdminBroadcastForm'
import { Button } from '@/components/ui/button'
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

type SortKey = 'created' | 'last_login' | 'login_count'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeLogin(iso: string | null) {
  if (!iso) return 'מעולם לא התחבר'

  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'היום'
  if (diffDays === 1) return 'אתמול'
  if (diffDays < 7) return `לפני ${diffDays} ימים`
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`
  return formatDate(iso)
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

function isThisMonth(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

export function AdminStudioList({ studios, appBaseUrl }: AdminStudioListProps) {
  const [rows, setRows] = useState(studios)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('last_login')
  const [logoutPending, startLogout] = useTransition()

  const stats = useMemo(() => {
    const loggedInToday = rows.filter(
      (row) => row.last_dashboard_login_at && isToday(row.last_dashboard_login_at)
    ).length
    const loggedInThisMonth = rows.filter(
      (row) => row.last_dashboard_login_at && isThisMonth(row.last_dashboard_login_at)
    ).length
    const neverLoggedIn = rows.filter((row) => !row.last_dashboard_login_at).length
    const totalLogins = rows.reduce((sum, row) => sum + row.dashboard_login_count, 0)

    return {
      total: rows.length,
      newToday: rows.filter((row) => isToday(row.created_at)).length,
      newThisMonth: rows.filter((row) => isThisMonth(row.created_at)).length,
      loggedInToday,
      loggedInThisMonth,
      neverLoggedIn,
      totalLogins,
    }
  }, [rows])

  const sortedRows = useMemo(() => {
    const copy = [...rows]

    copy.sort((a, b) => {
      if (sortKey === 'login_count') {
        return b.dashboard_login_count - a.dashboard_login_count
      }

      if (sortKey === 'last_login') {
        const aTime = a.last_dashboard_login_at
          ? new Date(a.last_dashboard_login_at).getTime()
          : 0
        const bTime = b.last_dashboard_login_at
          ? new Date(b.last_dashboard_login_at).getTime()
          : 0
        return bTime - aTime
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return copy
  }, [rows, sortKey])

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

  function handleLogout() {
    startLogout(async () => {
      await adminLogout()
      window.location.reload()
    })
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
    <div className="flex w-full max-w-7xl flex-col gap-8">
      <div className="rounded-2xl border border-[--border] bg-gradient-to-l from-[--card] via-[--card] to-[--background] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[--muted]">
              Gallery Studio
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">ניהול סטודיואים</h1>
            <p className="mt-2 max-w-2xl text-sm text-[--muted]">
              מעקב אחר פתיחת סטודיואים, כניסות לדשבורד ופעולות ניהול מרכזיות
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={logoutPending}
            className="shrink-0"
          >
            <LogOut className="h-4 w-4" />
            {logoutPending ? 'יוצא...' : 'יציאה'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[--border]/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>סה״כ סטודיואים</CardDescription>
            <Building2 className="h-4 w-4 text-[--muted]" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
            <p className="mt-1 text-xs text-[--muted]">
              {stats.newThisMonth} נפתחו החודש · {stats.newToday} היום
            </p>
          </CardContent>
        </Card>

        <Card className="border-[--border]/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>התחברו היום</CardDescription>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-emerald-700">{stats.loggedInToday}</CardTitle>
            <p className="mt-1 text-xs text-[--muted]">
              {stats.loggedInThisMonth} התחברו החודש
            </p>
          </CardContent>
        </Card>

        <Card className="border-[--border]/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>סה״כ כניסות לדשבורד</CardDescription>
            <LogIn className="h-4 w-4 text-[--muted]" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{stats.totalLogins}</CardTitle>
            <p className="mt-1 text-xs text-[--muted]">מכל הסטודיואים יחד</p>
          </CardContent>
        </Card>

        <Card className="border-[--border]/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>מעולם לא התחברו</CardDescription>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-amber-700">{stats.neverLoggedIn}</CardTitle>
            <p className="mt-1 text-xs text-[--muted]">סטודיואים ללא כניסה לדשבורד</p>
          </CardContent>
        </Card>
      </div>

      <AdminBroadcastForm />

      <Card className="overflow-hidden border-[--border]/80 shadow-sm">
        <CardHeader className="border-b border-[--border]/70 bg-[--card]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>רשימת סטודיואים</CardTitle>
              <CardDescription>
                {rows.length} סטודיואים · מיון לפי{' '}
                {sortKey === 'last_login'
                  ? 'כניסה אחרונה'
                  : sortKey === 'login_count'
                    ? 'מספר כניסות'
                    : 'תאריך פתיחה'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={sortKey === 'last_login' ? 'default' : 'outline'}
                onClick={() => setSortKey('last_login')}
              >
                כניסה אחרונה
              </Button>
              <Button
                type="button"
                size="sm"
                variant={sortKey === 'login_count' ? 'default' : 'outline'}
                onClick={() => setSortKey('login_count')}
              >
                מספר כניסות
              </Button>
              <Button
                type="button"
                size="sm"
                variant={sortKey === 'created' ? 'default' : 'outline'}
                onClick={() => setSortKey('created')}
              >
                תאריך פתיחה
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-[--border] bg-[--background]/60 text-right">
                <th className="px-4 py-3 font-medium text-[--muted]">סטודיו</th>
                <th className="px-4 py-3 font-medium text-[--muted]">אימייל</th>
                <th className="px-4 py-3 font-medium text-[--muted]">כניסה אחרונה</th>
                <th className="px-4 py-3 font-medium text-[--muted]">כניסות</th>
                <th className="px-4 py-3 font-medium text-[--muted]">תאריך פתיחה</th>
                <th className="px-4 py-3 font-medium text-[--muted]">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[--muted]">
                    אין סטודיואים עדיין
                  </td>
                </tr>
              ) : (
                sortedRows.map((studio) => {
                  const siteUrl = studio.site_path
                    ? `${appBaseUrl}${studio.site_path}`
                    : null
                  const hasRecentLogin =
                    studio.last_dashboard_login_at &&
                    isToday(studio.last_dashboard_login_at)

                  return (
                    <tr
                      key={studio.id}
                      className="border-b border-[--border]/70 transition-colors last:border-0 hover:bg-[--background]/50"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium">
                          {studio.studio_name || studio.name || '—'}
                        </div>
                        {studio.slug ? (
                          <div className="mt-0.5 text-xs text-[--muted]" dir="ltr">
                            /{studio.slug}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-[--muted]" dir="ltr">
                        {studio.email || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {studio.last_dashboard_login_at ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className={
                                hasRecentLogin
                                  ? 'inline-flex w-fit items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                                  : 'inline-flex w-fit items-center rounded-full bg-[--background] px-2 py-0.5 text-xs text-[--muted]'
                              }
                            >
                              {formatRelativeLogin(studio.last_dashboard_login_at)}
                            </span>
                            <span className="text-xs text-[--muted]">
                              {formatDate(studio.last_dashboard_login_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            מעולם לא התחבר
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-[--background] px-2 py-1 font-semibold tabular-nums">
                          {studio.dashboard_login_count}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-[--muted]">
                        <div className="flex items-center gap-1.5">
                          <CalendarPlus className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(studio.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {siteUrl ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={siteUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                                לאתר
                              </Link>
                            </Button>
                          ) : (
                            <span className="self-center text-xs text-[--muted]">אין אתר</span>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={impersonatingId === studio.id}
                            onClick={() => handleImpersonate(studio)}
                          >
                            {impersonatingId === studio.id ? 'נכנס...' : 'התחבר כמנהל'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={pendingId === studio.id}
                            onClick={() => handleDelete(studio)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
