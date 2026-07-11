'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminActionState } from '@/lib/actions/admin.actions'
import {
  requestAdminLoginCode,
  verifyAdminLoginCode,
} from '@/lib/actions/admin.actions'
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
import { KeyRound, LogIn, Mail, Shield } from 'lucide-react'

type AdminLoginFormProps = {
  initialStep?: 'email' | 'code'
}

export function AdminLoginForm({ initialStep = 'email' }: AdminLoginFormProps) {
  const router = useRouter()
  const [requestState, requestAction, requestPending] = useActionState<
    AdminActionState,
    FormData
  >(requestAdminLoginCode, { step: initialStep })

  const [verifyState, verifyAction, verifyPending] = useActionState<
    AdminActionState,
    FormData
  >(verifyAdminLoginCode, { step: initialStep })

  const step =
    verifyState.step === 'authenticated'
      ? 'authenticated'
      : requestState.step === 'code' || verifyState.step === 'code'
        ? 'code'
        : 'email'

  const error = requestState.error ?? verifyState.error
  const success = requestState.success ?? verifyState.success

  useEffect(() => {
    if (verifyState.step === 'authenticated') {
      router.refresh()
    }
  }, [verifyState.step, router])

  return (
    <Card className="w-full max-w-md overflow-hidden border-slate-200/80 shadow-md">
      <CardHeader className="border-b border-slate-200/80 bg-slate-800 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-200">
          Gallery Studio
        </p>
        <CardTitle className="mt-1 flex items-center gap-2 text-2xl text-white">
          <Shield className="h-5 w-5 text-sky-300" />
          ניהול מערכת
        </CardTitle>
        <CardDescription className="text-slate-300">
          {step === 'email'
            ? 'הזיני את מייל הניהול לקבלת קוד כניסה'
            : 'הזיני את הקוד שנשלח למייל'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 bg-slate-50/70 p-6">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        {success && step !== 'authenticated' ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </p>
        ) : null}

        {step === 'email' ? (
          <form action={requestAction} className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-sky-400 bg-white p-4 shadow-sm">
              <Label htmlFor="admin-email" className="flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-sky-600" />
                אימייל
              </Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@example.com"
                dir="ltr"
                className="mt-2 border-slate-200 bg-slate-50 focus-visible:ring-sky-300"
              />
            </div>
            <Button
              type="submit"
              disabled={requestPending}
              className="h-11 rounded-xl border border-sky-300 bg-sky-500 text-white shadow-md shadow-sky-500/20 hover:bg-sky-600"
            >
              <Mail className="h-4 w-4" />
              {requestPending ? 'שולח...' : 'שליחת קוד למייל'}
            </Button>
          </form>
        ) : (
          <form action={verifyAction} className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-violet-400 bg-white p-4 shadow-sm">
              <Label htmlFor="admin-code" className="flex items-center gap-2 text-slate-700">
                <KeyRound className="h-4 w-4 text-violet-600" />
                קוד כניסה
              </Label>
              <Input
                id="admin-code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoComplete="one-time-code"
                placeholder="123456"
                dir="ltr"
                className="mt-2 border-slate-200 bg-slate-50 text-center text-lg tracking-[0.3em] focus-visible:ring-violet-300"
              />
            </div>
            <Button
              type="submit"
              disabled={verifyPending}
              className="h-11 rounded-xl border border-violet-300 bg-violet-500 text-white shadow-md shadow-violet-500/20 hover:bg-violet-600"
            >
              <LogIn className="h-4 w-4" />
              {verifyPending ? 'מאמת...' : 'כניסה'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.refresh()}
              className="text-slate-600 hover:bg-white hover:text-slate-900"
            >
              שליחת קוד מחדש
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
