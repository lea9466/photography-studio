'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { AuthActionState } from '@/lib/actions/auth.actions'
import { updatePassword } from '@/lib/actions/auth.actions'
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

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(updatePassword, {})

  return (
    <Card className="w-full max-w-md animate-float-up">
      <CardHeader>
        <CardTitle>סיסמה חדשה</CardTitle>
        <CardDescription>בחרי סיסמה חדשה לחשבון שלך</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">סיסמה חדשה</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              dir="ltr"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm_password">אימות סיסמה</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              dir="ltr"
            />
          </div>

          {state.error ? (
            <p className="text-sm text-[--foreground]" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'שומר...' : 'שמירת סיסמה חדשה'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[--muted]">
          <Link
            href="/forgot-password"
            className="text-[--foreground] underline underline-offset-4 hover:text-[--accent]"
          >
            בקשי קישור שחזור חדש
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
