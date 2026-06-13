'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

export function SignupWelcomeBanner({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  const showWelcome = isOwner && searchParams.get('welcome') === '1' && !dismissed

  const dismiss = useCallback(() => {
    setDismissed(true)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('welcome')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, searchParams])

  if (!showWelcome) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-2xl animate-fade-in-up rounded-2xl border border-emerald-200/80 bg-[var(--color-white)]/95 p-5 shadow-xl shadow-emerald-900/10 backdrop-blur-md md:inset-x-auto md:px-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-right">
          <p className="font-medium text-[var(--color-paris-deep)]">
            האתר שלכם פעיל!
          </p>
          <p className="mt-1 text-sm text-[var(--color-paris-deep)]/65">
            התאימו את הנראות, הטקסטים והצבעים כדי שהאתר ישקף את הסטודיו שלכם.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-4 py-2 text-sm text-[var(--color-paris-deep)]/60 transition-colors hover:text-[var(--color-paris-deep)]"
          >
            אחר כך
          </button>
          <Link
            href="/admin?tab=settings"
            className="rounded-full bg-[var(--color-paris-blue)] px-6 py-2.5 text-sm tracking-wide text-white transition-all hover:shadow-lg hover:shadow-[var(--color-paris-blue)]/25"
          >
            עריכת נראות האתר
          </Link>
        </div>
      </div>
    </div>
  )
}
