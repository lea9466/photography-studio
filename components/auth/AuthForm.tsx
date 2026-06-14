'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { AuthActionState } from '@/lib/actions/auth.actions'
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

type AuthFormProps = {
  mode: 'login' | 'register'
  action: (
    prevState: AuthActionState,
    formData: FormData
  ) => Promise<AuthActionState>
  next?: string
}

export function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {})

  const isLogin = mode === 'login'

  return (
    <Card className="w-full max-w-md animate-float-up">
      <CardHeader>
        <CardTitle>{isLogin ? 'התחברות' : 'פתיחת סטודיו'}</CardTitle>
        <CardDescription>
          {isLogin
            ? 'היכנסי לניהול הגלריות שלך'
            : 'צרי חשבון צלמת חדש'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}

          {!isLogin ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">שם מלא</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="שם הצלמת"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="studio_name">שם הסטודיו (אופציונלי)</Label>
                <Input
                  id="studio_name"
                  name="studio_name"
                  type="text"
                  placeholder="Studio Gallery"
                />
              </div>
            </>
          ) : null}

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

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              minLength={isLogin ? 1 : 8}
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
            {pending
              ? 'רגע...'
              : isLogin
                ? 'התחברות'
                : 'יצירת חשבון'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[--muted]">
          {isLogin ? 'אין לך חשבון?' : 'כבר יש לך חשבון?'}{' '}
          <Link
            href={isLogin ? '/register' : '/login'}
            className="text-[--foreground] underline underline-offset-4 hover:text-[--accent]"
          >
            {isLogin ? 'הרשמה' : 'התחברות'}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
