'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import {
  headerCodeLoginAction,
  type CodeLoginResult,
} from '@/app/[photographer_slug]/code-login-actions'
import { tenantPath } from '@/lib/tenant-paths'

const initial: CodeLoginResult = { ok: false, message: '' }

export default function HeaderCodeLogin({
  photographerSlug,
  photographerId,
}: {
  photographerSlug: string
  photographerId: string
}) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, action, pending] = useActionState(
    headerCodeLoginAction.bind(null, photographerSlug, photographerId),
    initial
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="theme-cta-pill rounded-full border border-foreground/30 px-5 py-2 text-sm transition-all duration-500 hover:bg-foreground hover:text-background"
      >
        כניסה
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[70] m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-foreground/25"
        onClose={() => setOpen(false)}
      >
        <form
          action={action}
          className="flex min-h-full items-center justify-center p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div
            className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-background p-8 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2 text-right">
              <h2 className="text-lg font-medium text-foreground">כניסה עם קוד</h2>
              <p className="text-sm text-muted-foreground">
                הזינו קוד לקוח לאזור הלקוח, או קוד מנהל לניהול האתר.
              </p>
            </div>

            <label className="block space-y-2 text-right text-sm">
              <span className="text-foreground/90">קוד גישה</span>
              <input
                name="code"
                type="text"
                required
                autoComplete="one-time-code"
                autoFocus
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-shadow focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
              />
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

            <p className="text-center text-xs text-muted-foreground">
              <Link
                href={tenantPath(photographerSlug, '/client/forgot-code')}
                className="underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => setOpen(false)}
              >
                שכחתי קוד גישה
              </Link>
            </p>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-opacity disabled:opacity-50"
              >
                {pending ? 'בודק...' : 'כניסה'}
              </button>
            </div>
          </div>
        </form>
      </dialog>
    </>
  )
}
