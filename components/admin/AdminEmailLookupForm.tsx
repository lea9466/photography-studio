'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Mail, Search, XCircle } from 'lucide-react'
import type { AdminStudioRow } from '@/lib/admin/queries'
import { checkStudioEmailExists } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type AdminEmailLookupFormProps = {
  onStudioFound?: (studio: AdminStudioRow) => void
}

export function AdminEmailLookupForm({ onStudioFound }: AdminEmailLookupFormProps) {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<{
    exists: boolean
    studio: AdminStudioRow | null
    checkedEmail: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCheck() {
    const trimmed = email.trim()
    if (!trimmed) {
      toast.error('נא להזין אימייל')
      return
    }

    startTransition(async () => {
      try {
        const lookup = await checkStudioEmailExists(trimmed)
        setResult({
          exists: lookup.exists,
          studio: lookup.studio,
          checkedEmail: trimmed.toLowerCase(),
        })

        if (lookup.exists && lookup.studio) {
          onStudioFound?.(lookup.studio)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'בדיקת האימייל נכשלה')
      }
    })
  }

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-md">
      <CardHeader className="border-b border-[--border]/70 bg-gradient-to-l from-sky-50 via-[--card] to-[--card]">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-xl">בדיקת אימייל</CardTitle>
            <CardDescription className="mt-1">
              הזיני אימייל כדי לבדוק אם קיים סטודיו רשום במערכת
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 bg-slate-50/60 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="admin-email-lookup">אימייל</Label>
            <Input
              id="admin-email-lookup"
              type="email"
              dir="ltr"
              placeholder="example@email.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setResult(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleCheck()
                }
              }}
              disabled={isPending}
            />
          </div>
          <Button
            type="button"
            onClick={handleCheck}
            disabled={isPending}
            className="shrink-0 bg-sky-600 text-white hover:bg-sky-700"
          >
            <Search className="h-4 w-4" />
            {isPending ? 'בודק...' : 'בדוק אם קיים'}
          </Button>
        </div>

        {result ? (
          result.exists && result.studio ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 space-y-2">
                  <p className="font-semibold text-emerald-900">האימייל קיים במערכת</p>
                  <p className="text-sm text-emerald-800" dir="ltr">
                    {result.checkedEmail}
                  </p>
                  <div className="text-sm text-emerald-900">
                    <p>
                      <span className="font-medium">סטודיו:</span>{' '}
                      {result.studio.studio_name || result.studio.name || '—'}
                    </p>
                    {result.studio.slug ? (
                      <p className="mt-1" dir="ltr">
                        <span className="font-medium">כתובת:</span> /{result.studio.slug}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="font-semibold text-amber-900">האימייל לא קיים במערכת</p>
                  <p className="mt-1 text-sm text-amber-800" dir="ltr">
                    {result.checkedEmail}
                  </p>
                </div>
              </div>
            </div>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}
