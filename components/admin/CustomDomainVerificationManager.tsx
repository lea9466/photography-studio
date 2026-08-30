'use client'

import { useState, useTransition } from 'react'
import { updateCustomDomainVerificationToken } from '@/lib/actions/admin.actions'
import type { AdminCustomDomainRow } from '@/lib/admin/queries'

export type CustomDomainVerificationManagerProps = {
  domains: AdminCustomDomainRow[]
}

const STATUS_LABELS: Record<string, string> = {
  active: 'מחובר',
  pending: 'ממתין',
  pending_dns: 'ממתין לאימות בעלות',
  error: 'שגיאה',
}

function DomainRow({ domain }: { domain: AdminCustomDomainRow }) {
  const [value, setValue] = useState(domain.google_site_verification_token ?? '')
  const [saved, setSaved] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        await updateCustomDomainVerificationToken(domain.id, value)
        setSaved(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'השמירה נכשלה')
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:w-64 sm:shrink-0">
        <p className="truncate text-sm font-medium text-slate-900" dir="ltr">
          {domain.hostname}
        </p>
        <p className="text-xs text-slate-500">
          {domain.studio_name ?? domain.slug ?? '—'} · {STATUS_LABELS[domain.status] ?? domain.status}
        </p>
      </div>
      <div className="flex flex-1 gap-2">
        <input
          type="text"
          dir="ltr"
          placeholder="google-site-verification token"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setSaved(false)
          }}
          className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || saved}
          className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition disabled:opacity-40"
        >
          {isPending ? 'שומר...' : saved ? 'נשמר' : 'שמירה'}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

/**
 * Manual fallback for Google Search Console verification, per connected
 * custom domain — see lib/domains/custom-domain-lookup.ts's
 * getGoogleSiteVerificationToken doc comment for why this is manual (the
 * full API automation route was tried and blocked by this project's Google
 * Cloud org restrictions). Flow: verify the domain in Search Console
 * yourself using the "HTML tag" method (not DNS — never needs the
 * photographer's domain access), paste the token here, then click Verify in
 * Search Console — the token is already live on the domain's pages by then.
 */
export function CustomDomainVerificationManager({ domains }: CustomDomainVerificationManagerProps) {
  if (domains.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">אימות Google Search Console לדומיינים אישיים</h2>
        <p className="mt-1 text-xs text-slate-500">אין עדיין דומיינים מחוברים.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">אימות Google Search Console לדומיינים אישיים</h2>
      <p className="mt-1 text-xs text-slate-500">
        לכל דומיין: לאמת ב-Search Console בשיטת &quot;HTML tag&quot;, להדביק את הטוקן כאן, לשמור, ואז ללחוץ Verify שם.
      </p>
      <div className="mt-3">
        {domains.map((domain) => (
          <DomainRow key={domain.id} domain={domain} />
        ))}
      </div>
    </div>
  )
}
