'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import {
  platformLoginAction,
  type PlatformActionResult,
} from '@/app/platform/actions'

const initial: PlatformActionResult = { ok: false, message: '' }

const inputClass =
  'mt-1.5 w-full rounded-xl border border-[var(--color-blue-sky)] bg-[var(--color-white)] px-4 py-2.5 text-sm text-[var(--color-paris-deep)] outline-none transition-shadow focus:border-[var(--color-paris-blue)] focus:ring-2 focus:ring-[var(--color-paris-blue)]/20'

export default function PlatformLoginForm() {
  const [state, action, pending] = useActionState(platformLoginAction, initial)

  return (
    <form
      action={action}
      className="soft-card mx-auto max-w-md space-y-5 rounded-3xl border border-[var(--color-blue-sky)]/80 p-8"
    >
      <div>
        <h2 className="font-heading text-2xl text-[var(--color-paris-deep)]">
          כניסת מנהל פלטפורמה
        </h2>
        <p className="mt-2 text-sm text-[var(--color-paris-deep)]/60">
          צפייה בכל הצלמים, הגלריות והתמונות במערכת.
        </p>
      </div>

      <label className="block text-sm text-[var(--color-paris-deep)]/90">
        <span className="font-medium tracking-wide">אימייל</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-[var(--color-paris-deep)]/90">
        <span className="font-medium tracking-wide">סיסמה</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>

      {state.message ? (
        <p
          role="status"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[var(--color-paris-blue)] px-6 py-3 text-sm tracking-wide text-white transition-all hover:shadow-lg hover:shadow-[var(--color-paris-blue)]/25 disabled:opacity-50"
      >
        {pending ? 'מתחבר...' : 'כניסה'}
      </button>

      <p className="text-center text-sm text-[var(--color-paris-deep)]/60">
        <Link
          href="/platform/forgot-password"
          className="font-medium text-[var(--color-paris-blue)] hover:underline"
        >
          שכחתי סיסמה
        </Link>
      </p>
    </form>
  )
}
