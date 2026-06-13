'use client'

import { useActionState } from 'react'
import {
  submitTestimonialAction,
  type ClientActionResult,
} from '@/app/[photographer_slug]/client/actions'
import type { TestimonialsRow } from '@/lib/database.types'

const initial: ClientActionResult = { ok: false, message: '' }

const statusLabels: Record<string, string> = {
  pending: 'ממתינה לאישור הסטודיו',
  approved: 'פורסמה באתר',
  rejected: 'לא אושרה — ניתן לשלוח המלצה חדשה',
}

const inputClass =
  'mt-2 w-full border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-shadow focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--color-brand)_20%,transparent)]'

export default function TestimonialForm({
  existing,
  photographerSlug,
}: {
  existing: TestimonialsRow | null
  photographerSlug: string
}) {
  const [state, action, pending] = useActionState(
    submitTestimonialAction.bind(null, photographerSlug),
    initial
  )

  const canSubmit =
    !existing || existing.status === 'rejected'

  return (
    <div className="soft-card mt-14 border border-border p-8">
      <h2 className="font-display text-2xl text-foreground">
        המלצה על הסטודיו
      </h2>
      <p className="client-muted-text mt-2 text-sm">
        שתפו את החוויה שלכם. ההמלצה תפורסם בדף הבית רק לאחר אישור הסטודיו.
      </p>

      {existing && existing.status !== 'rejected' ? (
        <div className="mt-6 border border-border bg-muted px-5 py-4">
          <p className="client-muted-text text-xs uppercase tracking-[0.25em]">
            סטטוס: {statusLabels[existing.status] ?? existing.status}
          </p>
          <blockquote className="mt-4 border-r-2 border-[var(--color-brand)] pr-4 leading-relaxed text-foreground/85">
            {existing.content}
          </blockquote>
        </div>
      ) : null}

      {canSubmit ? (
        <form action={action} className="mt-6 space-y-4">
          <label className="block text-sm text-foreground/90">
            <span className="font-medium tracking-wide">טקסט ההמלצה</span>
            <textarea
              name="content"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              placeholder="ספרו בקצרה על החוויה שלכם..."
              className={inputClass}
              defaultValue=""
            />
            <span className="client-muted-text mt-1 block text-xs">
              לפחות 10 תווים
            </span>
          </label>

          {state.message ? (
            <p
              role="status"
              className={`rounded-xl px-4 py-3 text-sm ${
                state.ok
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="client-btn-primary px-8 py-3 text-sm tracking-wide disabled:opacity-60"
          >
            {pending ? 'שולח...' : 'שליחת המלצה'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
