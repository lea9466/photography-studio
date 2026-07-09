'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminStudioList({ studios, appBaseUrl }: AdminStudioListProps) {
  const [rows, setRows] = useState(studios)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [logoutPending, startLogout] = useTransition()

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

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ניהול סטודיואים</h1>
          <p className="mt-1 text-sm text-[--muted]">
            סה״כ {rows.length} סטודיואים נפתחו
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={logoutPending}
        >
          {logoutPending ? 'יוצא...' : 'יציאה'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>סה״כ סטודיואים</CardDescription>
            <CardTitle className="text-3xl">{rows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>החודש</CardDescription>
            <CardTitle className="text-3xl">
              {
                rows.filter((row) => {
                  const created = new Date(row.created_at)
                  const now = new Date()
                  return (
                    created.getFullYear() === now.getFullYear() &&
                    created.getMonth() === now.getMonth()
                  )
                }).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>היום</CardDescription>
            <CardTitle className="text-3xl">
              {
                rows.filter((row) => {
                  const created = new Date(row.created_at)
                  const now = new Date()
                  return created.toDateString() === now.toDateString()
                }).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <AdminBroadcastForm />

      <Card>
        <CardHeader>
          <CardTitle>רשימת סטודיואים</CardTitle>
          <CardDescription>ממוין לפי תאריך פתיחה (חדש לישן)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[--border] text-right">
                <th className="px-4 py-3 font-medium">סטודיו</th>
                <th className="px-4 py-3 font-medium">אימייל</th>
                <th className="px-4 py-3 font-medium">תאריך פתיחה</th>
                <th className="px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[--muted]">
                    אין סטודיואים עדיין
                  </td>
                </tr>
              ) : (
                rows.map((studio) => {
                  const siteUrl = studio.site_path
                    ? `${appBaseUrl}${studio.site_path}`
                    : null

                  return (
                    <tr
                      key={studio.id}
                      className="border-b border-[--border] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {studio.studio_name || studio.name || '—'}
                        </div>
                        {studio.slug ? (
                          <div className="text-xs text-[--muted]" dir="ltr">
                            /{studio.slug}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        {studio.email || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(studio.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {siteUrl ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={siteUrl} target="_blank" rel="noopener noreferrer">
                                לאתר
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-[--muted]">אין אתר</span>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={pendingId === studio.id}
                            onClick={() => handleDelete(studio)}
                          >
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
