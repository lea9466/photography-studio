'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import {
  studioLoginAction,
  studioSignupAction,
  type StudioActionResult,
} from '@/app/studio/actions'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-[var(--color-blue-sky)] bg-[var(--color-white)] px-4 py-2.5 text-sm text-[var(--color-paris-deep)] outline-none transition-shadow focus:border-[var(--color-paris-blue)] focus:ring-2 focus:ring-[var(--color-paris-blue)]/20'

const initial: StudioActionResult = { ok: false, message: '' }

export function StudioLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(studioLoginAction, initial)

  return (
    <form
      action={action}
      className="soft-card mx-auto max-w-md space-y-5 rounded-3xl border border-[var(--color-blue-sky)]/80 p-8"
    >
      <div>
        <h2 className="font-heading text-2xl text-[var(--color-paris-deep)]">
          כניסה לסטודיו
        </h2>
        <p className="mt-2 text-sm text-[var(--color-paris-deep)]/60">
          התחברו לניהול האתר והגלריות שלכם.
        </p>
      </div>

      {next ? <input type="hidden" name="next" value={next} /> : null}

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
        {pending ? 'מתחבר...' : 'התחברות'}
      </button>

      <p className="text-center text-sm text-[var(--color-paris-deep)]/60">
        <Link
          href="/studio/forgot-password"
          className="font-medium text-[var(--color-paris-blue)] hover:underline"
        >
          שכחתי סיסמה
        </Link>
      </p>

      <p className="text-center text-sm text-[var(--color-paris-deep)]/60">
        עדיין אין לכם חשבון?{' '}
        <Link
          href="/studio/signup"
          className="font-medium text-[var(--color-paris-blue)] hover:underline"
        >
          הרשמה
        </Link>
      </p>
    </form>
  )
}

export function StudioSignupForm({
  defaultEmail = '',
  linkedHint = false,
  passwordOptional = false,
}: {
  defaultEmail?: string
  linkedHint?: boolean
  passwordOptional?: boolean
}) {
  const [state, action, pending] = useActionState(studioSignupAction, initial)

  return (
    <form
      action={action}
      className="soft-card mx-auto max-w-md space-y-5 rounded-3xl border border-[var(--color-blue-sky)]/80 p-8"
    >
      <div>
        <h2 className="font-heading text-2xl text-[var(--color-paris-deep)]">
          פתיחת סטודיו חדש
        </h2>
        <p className="mt-2 text-sm text-[var(--color-paris-deep)]/60">
          הרשמו וקבלו אתר אישי עם כתובת ייחודית.
        </p>
        {linkedHint ? (
          <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            התחברתם בהצלחה — השלימו את פרטי הסטודיו כדי לפתוח את האתר שלכם.
          </p>
        ) : null}
      </div>

      <label className="block text-sm text-[var(--color-paris-deep)]/90">
        <span className="font-medium tracking-wide">שם הסטודיו / הצלם</span>
        <input
          name="display_name"
          type="text"
          required
          autoComplete="organization"
          className={inputClass}
          placeholder="לדוגמה: לאה כהן צילום"
        />
      </label>

      <label className="block text-sm text-[var(--color-paris-deep)]/90">
        <span className="font-medium tracking-wide">אימייל</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          defaultValue={defaultEmail}
          className={inputClass}
        />
      </label>

      {!passwordOptional ? (
        <label className="block text-sm text-[var(--color-paris-deep)]/90">
          <span className="font-medium tracking-wide">סיסמה</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-[var(--color-paris-deep)]/50">
            לפחות 6 תווים
          </span>
        </label>
      ) : null}

      <label className="block text-sm text-[var(--color-paris-deep)]/90">
        <span className="font-medium tracking-wide">כתובת האתר (באנגלית)</span>
        <input
          name="slug"
          type="text"
          dir="ltr"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className={inputClass}
          placeholder="lea-studio"
        />
        <span className="mt-1 block text-xs text-[var(--color-paris-deep)]/50">
          האתר יהיה בכתובת: yoursite.com/
          <span dir="ltr" className="font-mono">
            slug
          </span>
        </span>
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
        {pending ? 'פותחים סטודיו...' : 'הרשמה ופתיחת אתר'}
      </button>

      <p className="text-center text-sm text-[var(--color-paris-deep)]/60">
        כבר יש לכם חשבון?{' '}
        <Link
          href="/studio/login"
          className="font-medium text-[var(--color-paris-blue)] hover:underline"
        >
          התחברות
        </Link>
      </p>
    </form>
  )
}
