'use client'

import { useActionState } from 'react'
import {
  submitContactAction,
  type ContactActionResult,
} from '@/app/contact/actions'

const initial: ContactActionResult = { ok: false, message: '' }

export type ContactFormProps = {
  source: 'general' | 'package' | 'gallery'
  packageId?: string
  packageTitle?: string
  isFeatured?: boolean
}

export default function ContactForm({
  source,
  packageId = '',
  packageTitle = '',
  isFeatured = false,
}: ContactFormProps) {
  const [state, action, pending] = useActionState(submitContactAction, initial)

  const labelClass =
    'block text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3'
  const inputClass =
    'w-full bg-transparent border-b border-foreground/25 focus:border-foreground outline-none py-3 text-foreground placeholder:text-muted-foreground/50 transition-colors resize-none'

  if (state.ok) {
    return (
      <div className="space-y-3 py-8 text-center md:text-right">
        <h2 className="font-display text-3xl text-foreground">תודה!</h2>
        <p className="text-foreground/70">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={action} className="text-right">
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="packageId" value={packageId} />
      <input type="hidden" name="packageTitle" value={packageTitle} />
      <input type="hidden" name="isFeatured" value={isFeatured ? 'true' : 'false'} />

      <div className="hidden" aria-hidden>
        <label>
          אל תמלאו שדה זה
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>שם מלא</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="איך לקרוא לכם?"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>טלפון</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="050-0000000"
            className={inputClass}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>אימייל</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>

        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">
            ספרו לי על הרגע
          </label>
          <textarea
            name="message"
            rows={4}
            className={inputClass}
            placeholder="מתי, איפה, ומה החלום..."
          />
        </div>

        {state.message ? (
          <p
            role="status"
            className="sm:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {state.message}
          </p>
        ) : null}

        <div className="sm:col-span-2 mt-4 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-[11px] tracking-wide text-muted-foreground">
            יש להזין טלפון או אימייל כדי שנוכל לחזור אליכם.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="theme-cta-primary group/btn relative inline-flex w-full items-center justify-center gap-4 overflow-hidden bg-foreground px-10 py-4 text-xs uppercase tracking-[0.3em] text-background transition-all duration-500 hover:gap-6 disabled:opacity-70 sm:w-auto"
          >
            <span>{pending ? 'שולח...' : 'שליחת בקשה'}</span>
            {!pending ? (
              <span className="transition-transform duration-500 group-hover/btn:-translate-x-1">
                ←
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </form>
  )
}
