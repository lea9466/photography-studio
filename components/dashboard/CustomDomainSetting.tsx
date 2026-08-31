'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Globe, Loader2 } from 'lucide-react'
import {
  checkCustomDomainStatus,
  connectCustomDomain,
  disconnectCustomDomain,
} from '@/lib/actions/custom-domain.actions'
import type { CustomDomain } from '@/lib/types/database.types'
import { isApexHostname } from '@/lib/validations/domain'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CustomDomainSettingProps = {
  initialDomain: CustomDomain | null
  /** VERCEL_CNAME_TARGET — the CNAME target shown for a subdomain. */
  cnameTarget: string
  /** VERCEL_APEX_A_RECORD — the A-record IP shown for a bare root domain. */
  apexARecord: string
  /**
   * False for a downgraded-from-Pro photographer who still has an existing
   * connection to manage — she can view/disconnect it, but not connect a
   * new one or retry a failed one (the server enforces this too either way).
   */
  canConnect: boolean
}

type VercelVerificationChallenge = { type: string; domain: string; value: string; reason: string }

const POLL_INTERVAL_MS = 10_000
const POLL_TIMEOUT_MS = 20 * 60 * 1000

function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('העתקה נכשלה')
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[--border]/80 bg-white/80 px-3 py-2">
      <code className="min-w-0 flex-1 truncate text-xs text-[--foreground]" dir="ltr">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 text-[--muted] hover:text-[--foreground]"
        aria-label="העתקה"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function CustomDomainSetting({
  initialDomain,
  cnameTarget,
  apexARecord,
  canConnect,
}: CustomDomainSettingProps) {
  const [domain, setDomain] = useState(initialDomain)
  const [hostnameInput, setHostnameInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const pollStartedAt = useRef<number | null>(null)

  const status = domain?.status ?? null
  // Keep polling past 'active' while dns_live is still false — Vercel
  // accepting the attach (status='active') and DNS actually being
  // configured (dns_live) are separate, independently-timed things; see
  // getDomainConfig's doc comment in lib/vercel/domains.ts.
  const stillWaiting =
    status === 'pending' || status === 'pending_dns' || (status === 'active' && domain?.dns_live === false)

  useEffect(() => {
    if (!stillWaiting) {
      pollStartedAt.current = null
      return
    }

    if (pollStartedAt.current === null) pollStartedAt.current = Date.now()

    const interval = setInterval(() => {
      if (!domain) return
      if (Date.now() - (pollStartedAt.current ?? Date.now()) > POLL_TIMEOUT_MS) {
        clearInterval(interval)
        return
      }
      checkCustomDomainStatus(domain.id)
        .then(setDomain)
        .catch(() => {
          // Silent — the manual "בדוק סטטוס" button surfaces errors explicitly.
        })
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stillWaiting, domain?.id])

  function handleConnect() {
    const hostname = hostnameInput.trim()
    if (!hostname) return

    startTransition(async () => {
      try {
        const result = await connectCustomDomain({ hostname })
        setDomain(result)
        toast.success(`${result.hostname} נוסף — יש להשלים את הגדרות ה-DNS למטה`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'חיבור הדומיין נכשל')
      }
    })
  }

  function handleCheckStatus() {
    if (!domain) return
    startTransition(async () => {
      try {
        const result = await checkCustomDomainStatus(domain.id)
        setDomain(result)
        if (result.status === 'active' && result.dns_live) {
          toast.success('הדומיין אומת ומחובר!')
        } else {
          toast.info('עדיין ממתינה לרשומת ה-DNS')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'בדיקת הסטטוס נכשלה')
      }
    })
  }

  function handleDisconnect() {
    if (!domain) return
    if (!window.confirm(`לנתק את ${domain.hostname}? האתר יפסיק להיות זמין בכתובת הזו.`)) return

    startTransition(async () => {
      try {
        await disconnectCustomDomain(domain.id)
        setDomain(null)
        setHostnameInput('')
        toast.success('הדומיין נותק')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'ניתוק הדומיין נכשל')
      }
    })
  }

  function handleRetry() {
    if (!domain) return
    startTransition(async () => {
      try {
        const result = await connectCustomDomain({ hostname: domain.hostname })
        setDomain(result)
        toast.success('מנסה שוב לחבר את הדומיין')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'החיבור נכשל')
      }
    })
  }

  const verificationChallenge = (domain?.vercel_verification as VercelVerificationChallenge[] | null)?.[0] ?? null

  return (
    <section className="relative space-y-5 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8">
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
            <Globe className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-lg font-semibold text-[--foreground]">דומיין אישי</h2>
            <p className="text-xs leading-relaxed text-[--muted]">
              חברי דומיין משלך — דומיין ראשי (השם-שלך.com) או תת-דומיין (www.השם-שלך.com) — כדי שהאתר יופיע בכתובת שלך במקום ב-slug.
            </p>
          </div>
        </div>
      </div>

      {!domain && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            dir="ltr"
            placeholder="www.your-domain.com"
            value={hostnameInput}
            onChange={(event) => setHostnameInput(event.target.value)}
            disabled={isPending}
          />
          <Button type="button" onClick={handleConnect} disabled={isPending || !hostnameInput.trim()}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'חברי דומיין'}
          </Button>
        </div>
      )}

      {domain && domain.status === 'pending' && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
          <p className="text-sm font-semibold text-amber-900">מחברת את {domain.hostname}...</p>
        </div>
      )}

      {domain && domain.status === 'pending_dns' && (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-sm font-semibold text-amber-900">
            נדרש אימות בעלות נוסף — {domain.hostname}
          </p>
          <p className="text-xs leading-relaxed text-[--muted]">
            הדומיין הזה כבר מוכר ל-Vercel מחשבון אחר. כדי להוכיח שהוא שלך, הוסיפי את רשומת ה-TXT הבאה
            אצל ספק הדומיין שלך:
          </p>
          {verificationChallenge && (
            <div className="space-y-1 text-xs text-[--muted]">
              <p className="font-medium text-[--foreground]">
                שם: <span dir="ltr">{verificationChallenge.domain}</span>
              </p>
              <CopyableValue value={verificationChallenge.value} />
            </div>
          )}
          <Button type="button" variant="outline" onClick={handleCheckStatus} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'בדקי סטטוס'}
          </Button>
        </div>
      )}

      {domain && domain.status === 'active' && domain.dns_live && (
        <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-900">מחובר ופעיל</p>
              <a
                href={`https://${domain.hostname}`}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="text-sm text-emerald-800 underline"
              >
                {domain.hostname}
              </a>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleDisconnect}
              disabled={isPending}
              className="shrink-0 border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
            >
              נתקי דומיין
            </Button>
          </div>
          {!canConnect && (
            <p className="border-t border-emerald-200/60 pt-3 text-xs font-medium text-amber-800">
              הדומיין ממשיך לעבוד, אבל חיבור דומיין חדש (אם תנתקי את זה) דורש תוכנית Pro.
            </p>
          )}
        </div>
      )}

      {domain && domain.status === 'active' && !domain.dns_live && (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
            <p className="text-sm font-semibold text-amber-900">
              עדיין ממתינה לרשומת ה-DNS — {domain.hostname}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-[--muted]">
            הדומיין רשום אצלנו, אבל עדיין לא זיהינו את רשומת ה-DNS אצל ספק הדומיין שלך. האתר לא יעלה עד שהרשומה
            הבאה תתווסף שם:
          </p>
          {isApexHostname(domain.hostname) ? (
            <div className="space-y-1 text-xs text-[--muted]">
              <p className="font-medium text-[--foreground]">רשומת A (שדה Host ריק/@):</p>
              <CopyableValue value={apexARecord} />
            </div>
          ) : (
            <div className="space-y-1 text-xs text-[--muted]">
              <p className="font-medium text-[--foreground]">רשומת CNAME (שדה Host: www):</p>
              <CopyableValue value={cnameTarget} />
            </div>
          )}
          <p className="text-xs leading-relaxed text-[--muted]">
            אחרי שהוספת את הרשומה אצל ספק הדומיין — זה יכול לקחת עד כמה שעות עד שהיא נכנסת לתוקף בכל העולם. אפשר
            ללחוץ "בדקי סטטוס" מדי פעם כדי לראות אם זה כבר עבד.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleCheckStatus} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'בדקי סטטוס'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDisconnect}
              disabled={isPending}
              className="border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
            >
              נתקי דומיין
            </Button>
          </div>
        </div>
      )}

      {domain && domain.status === 'error' && (
        <div className={cn('space-y-3 rounded-xl border border-red-200 bg-red-50/70 p-4')}>
          <p className="text-sm font-semibold text-red-900">חיבור {domain.hostname} נכשל</p>
          {domain.last_error && <p className="text-xs text-red-800">{domain.last_error}</p>}
          {!canConnect && (
            <p className="text-xs text-red-800">ניסיון חוזר דורש תוכנית Pro.</p>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleRetry} disabled={isPending || !canConnect}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'נסי שוב'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDisconnect}
              disabled={isPending}
              className="border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
            >
              ניתוק
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
