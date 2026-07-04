'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { AuthActionState } from '@/lib/actions/auth.actions'
import { requestPasswordReset } from '@/lib/actions/auth.actions'
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

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(requestPasswordReset, {})

  return (
    <Card className="w-full max-w-md animate-float-up">
      <CardHeader>
        <CardTitle>שחזור סיסמה</CardTitle>
        <CardDescription>
          הזיני את האימייל שלך ונשלח לך סיסמה חדשה למייל
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@studio.com"
              dir="ltr"
            />
          </div>

          {state.error ? (
            <p className="text-sm text-[--foreground]" role="alert">
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p className="text-sm text-[--foreground]" role="status">
              {state.success}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'שולח...' : 'שליחת סיסמה חדשה'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[--muted]">
          <Link
            href="/login"
            className="text-[--foreground] underline underline-offset-4 hover:text-[--accent]"
          >
            חזרה להתחברות
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
