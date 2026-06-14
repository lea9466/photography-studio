'use client'

import { useActionState } from 'react'
import { resendConfirmationEmail } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResendConfirmation() {
  const [state, formAction, pending] = useActionState(
    resendConfirmationEmail,
    {}
  )

  return (
    <div className="rounded-xl border border-[--border] p-4 text-sm">
      <p className="mb-3 text-[--muted]">לא קיבלת מייל אימות?</p>
      <form action={formAction} className="flex flex-col gap-3">
        <div className="space-y-2">
          <Label htmlFor="resend-email">אימייל</Label>
          <Input
            id="resend-email"
            name="email"
            type="email"
            dir="ltr"
            required
            placeholder="you@studio.com"
          />
        </div>
        {state.error ? (
          <p className="text-[--foreground]" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-[--foreground]" role="status">
            {state.success}
          </p>
        ) : null}
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? 'שולח...' : 'שלחי מייל אימות שוב'}
        </Button>
      </form>
    </div>
  )
}
