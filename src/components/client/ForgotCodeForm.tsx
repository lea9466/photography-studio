'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import {
  clientForgotCodeAction,
  type ForgotCodeResult,
} from '@/app/[photographer_slug]/client/forgot-code/actions'
import { tenantPath } from '@/lib/tenant-paths'

const initial: ForgotCodeResult = { ok: false, message: '' }

const inputClass =
  'mt-1.5 w-full rounded-xl border border-[var(--color-blue-sky)] bg-[var(--color-white)] px-4 py-2.5 text-sm text-[var(--color-paris-deep)] outline-none transition-shadow focus:border-[var(--color-paris-blue)] focus:ring-2 focus:ring-[var(--color-paris-blue)]/20'

export default function ForgotCodeForm({
  photographerSlug,
  photographerId,
  studioName,
}: {
  photographerSlug: string
  photographerId: string
  studioName: string
}) {
  const [state, action, pending] = useActionState(
    clientForgotCodeAction.bind(
      null,
      photographerSlug,
      photographerId,
      studioName
    ),
    initial
  )

  return (
    <form
      action={action}
      className="soft-card mx-auto max-w-md space-y-5 rounded-3xl border border-[var(--color-blue-sky)]/80 p-8"
    >
      <div>
        <h2 className="font-heading text-2xl text-[var(--color-paris-deep)]">
          שכחתי קוד גישה
        </h2>
        <p className="mt-2 text-sm text-[var(--color-paris-deep)]/60">
          הזינו את האימייל שקיבלתם מהסטודיו. נשלח אליכם קוד גישה חדש.
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
        {pending ? 'שולח...' : 'שליחת קוד חדש'}
      </button>

      <p className="text-center text-sm text-[var(--color-paris-deep)]/60">
        <Link
          href={tenantPath(photographerSlug, '/client')}
          className="font-medium text-[var(--color-paris-blue)] hover:underline"
        >
          חזרה להתחברות
        </Link>
      </p>
    </form>
  )
}
