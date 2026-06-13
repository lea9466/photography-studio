'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import {
  studioResetPasswordAction,
  type StudioActionResult,
} from '@/app/studio/actions'

const initial: StudioActionResult = { ok: false, message: '' }

const inputClass =
  'mt-1.5 w-full rounded-xl border border-[var(--color-blue-sky)] bg-[var(--color-white)] px-4 py-2.5 text-sm text-[var(--color-paris-deep)] outline-none transition-shadow focus:border-[var(--color-paris-blue)] focus:ring-2 focus:ring-[var(--color-paris-blue)]/20'

export default function StudioResetPasswordForm({
  sessionValid,
}: {
  sessionValid: boolean
}) {
  const [state, action, pending] = useActionState(
    studioResetPasswordAction,
    initial
  )

  if (!sessionValid) {
    return (
      <div className="soft-card mx-auto max-w-md rounded-3xl border border-[var(--color-blue-sky)]/80 p-8 text-center text-sm text-red-800">
        קישור האיפוס אינו תקין או שפג תוקפו.
        <p className="mt-4">
          <Link
            href="/studio/forgot-password"
            className="font-medium text-[var(--color-paris-blue)] hover:underline"
          >
            בקשו קישור חדש
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form
      action={action}
      className="soft-card mx-auto max-w-md space-y-5 rounded-3xl border border-[var(--color-blue-sky)]/80 p-8"
    >
      <div>
        <h2 className="font-heading text-2xl text-[var(--color-paris-deep)]">
          סיסמה חדשה
        </h2>
        <p className="mt-2 text-sm text-[var(--color-paris-deep)]/60">
          בחרו סיסמה חדשה לחשבון הסטודיו שלכם.
        </p>
      </div>

      <label className="block text-sm text-[var(--color-paris-deep)]/90">
        <span className="font-medium tracking-wide">סיסמה חדשה</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-[var(--color-paris-deep)]/90">
        <span className="font-medium tracking-wide">אימות סיסמה</span>
        <input
          name="confirm_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      {state.message ? (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm ${
            state.ok
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[var(--color-paris-blue)] px-6 py-3 text-sm tracking-wide text-white transition-all hover:shadow-lg hover:shadow-[var(--color-paris-blue)]/25 disabled:opacity-50"
      >
        {pending ? 'שומר...' : 'שמירת סיסמה'}
      </button>

      {state.ok ? (
        <p className="text-center text-sm text-[var(--color-paris-deep)]/60">
          <Link
            href="/studio/login"
            className="font-medium text-[var(--color-paris-blue)] hover:underline"
          >
            מעבר להתחברות
          </Link>
        </p>
      ) : null}
    </form>
  )
}
