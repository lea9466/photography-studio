'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  fetchUnsentContactInquiries,
  resendContactInquiry,
  type AdminUnsentInquiry,
} from '@/lib/actions/admin.actions'

const dateFormatter = new Intl.DateTimeFormat('he-IL', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Jerusalem',
})

/**
 * Contact-form inquiries whose email never reached the photographer (all
 * providers failed). Each row can be resent; a sent row drops off the list.
 */
export function UnsentInquiriesManager() {
  const [rows, setRows] = useState<AdminUnsentInquiry[] | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    fetchUnsentContactInquiries()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  function handleResend(id: string) {
    setPendingId(id)
    setErrors((prev) => ({ ...prev, [id]: '' }))
    startTransition(async () => {
      const result = await resendContactInquiry(id)
      setPendingId(null)
      if (result.ok) {
        setRows((prev) => prev?.filter((row) => row.id !== id) ?? null)
      } else {
        setErrors((prev) => ({ ...prev, [id]: result.error }))
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">פניות מהאתרים שלא הגיעו לצלמת</h2>
      <p className="mt-1 text-xs text-slate-500">
        פניות מטופס יצירת הקשר שהמייל עליהן נכשל בכל ספקי המייל. הפנייה שמורה — אפשר לשלוח אותה שוב.
      </p>

      {rows === null ? (
        <p className="mt-4 text-sm text-slate-500">טוען...</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-emerald-700">אין פניות תקועות — כל הפניות הגיעו.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-slate-900">
                    {row.clientName} ← {row.photographerName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {dateFormatter.format(new Date(row.createdAt))} · {row.clientEmail}
                    {row.clientPhone ? ` · ${row.clientPhone}` : ''} · אל {row.photographerEmail ?? 'אין מייל'}
                  </p>
                  {row.subject ? <p className="text-slate-700">נושא: {row.subject}</p> : null}
                  <p className="whitespace-pre-line text-slate-700">{row.message}</p>
                  {row.emailError ? (
                    <p className="text-xs text-red-600">
                      שגיאה אחרונה ({row.emailAttempts} ניסיונות): {row.emailError}
                    </p>
                  ) : null}
                  {errors[row.id] ? <p className="text-xs text-red-600">{errors[row.id]}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleResend(row.id)}
                  disabled={pendingId !== null}
                  className="shrink-0 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-60"
                >
                  {pendingId === row.id ? 'שולח...' : 'שלח שוב'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
