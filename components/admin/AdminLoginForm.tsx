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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>ניהול מערכת</CardTitle>
        <CardDescription>
          {step === 'email'
            ? 'הזיני את מייל הניהול לקבלת קוד כניסה'
            : 'הזיני את הקוד שנשלח למייל'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {success && step !== 'authenticated' ? (
          <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </p>
        ) : null}

        {step === 'email' ? (
          <form action={requestAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-email">אימייל</Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@example.com"
                dir="ltr"
              />
            </div>
            <Button type="submit" disabled={requestPending}>
              {requestPending ? 'שולח...' : 'שליחת קוד למייל'}
            </Button>
          </form>
        ) : (
          <form action={verifyAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-code">קוד כניסה</Label>
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
                className="text-center text-lg tracking-[0.3em]"
              />
            </div>
            <Button type="submit" disabled={verifyPending}>
              {verifyPending ? 'מאמת...' : 'כניסה'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.refresh()}
            >
              שליחת קוד מחדש
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
