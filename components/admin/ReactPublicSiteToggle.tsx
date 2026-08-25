'use client'

import { useState, useTransition } from 'react'
import { updateReactPublicSiteEnabled } from '@/lib/actions/admin.actions'

export type ReactPublicSiteToggleProps = {
  initialEnabled: boolean
}

/**
 * Global kill switch for the React public-site rollout — see
 * lib/public-site/react-rollout.ts's doc comment. One button, one flag,
 * affects every studio's public pages for every real visitor immediately.
 */
export function ReactPublicSiteToggle({ initialEnabled }: ReactPublicSiteToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !enabled
    setError(null)
    startTransition(async () => {
      try {
        const result = await updateReactPublicSiteEnabled(next)
        setEnabled(result.react_public_site_enabled)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'העדכון נכשל')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">האתר הציבורי החדש (React)</h2>
        <p className="mt-1 text-xs text-slate-500">
          {enabled
            ? 'פעיל — כל המבקרים בכל הסטודיואים רואים את הקוד החדש.'
            : 'כבוי — כולם רואים את המערכת הישנה.'}
        </p>
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition disabled:opacity-60 ${
          enabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-500 hover:bg-slate-600'
        }`}
      >
        {isPending ? 'מעדכן...' : enabled ? 'כבה לכולם' : 'הפעל לכולם'}
      </button>
    </div>
  )
}
