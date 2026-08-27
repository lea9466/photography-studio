'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import Script from 'next/script'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CurrentSubscriptionView } from '@/lib/payments/payment-service'

/**
 * SUMIT PaymentsJS in-site card form. The card fields are read straight from
 * the DOM by SUMIT's `payments.js` (`OfficeGuy.Payments.CreateToken`) — they
 * are uncontrolled and carry no `name`, so the PAN/CVV never enter React state
 * and are never posted to our server. We only ever forward the resulting
 * single-use token to `/api/payments/subscription/charge`.
 *
 * `payments.js` uses jQuery as an external global and does NOT bundle it, so we
 * vendor jQuery (npm) onto `window` before the SUMIT script loads — without it
 * `CreateToken` throws `jQuery is not defined` and no callback ever fires.
 */

const SCRIPT_URL = 'https://app.sumit.co.il/scripts/payments.js'
const COMPANY_ID = process.env.NEXT_PUBLIC_SUMIT_COMPANY_ID ?? ''
const API_PUBLIC_KEY = process.env.NEXT_PUBLIC_SUMIT_API_PUBLIC_KEY ?? ''

type CreateTokenResponse = {
  Status?: number
  Data?: { SingleUseToken?: string }
  UserErrorMessage?: string
  TechnicalErrorDetails?: string
}

type CreateTokenConfig = {
  CompanyID: string
  APIPublicKey: string
  FormSelector: string
  ResponseLanguage?: string
  ErrorsClass?: string
  ResponseCallback?: (response: CreateTokenResponse) => void
  Callback?: (token: string | null) => void
}

declare global {
  interface Window {
    jQuery?: unknown
    $?: unknown
    OfficeGuy?: {
      Payments?: { CreateToken?: (config: CreateTokenConfig) => void }
    }
  }
}

type Props = {
  planCode: string
  planName: string
  priceLabel: string
  onSuccess: (status: CurrentSubscriptionView) => void
  onCancel: () => void
}

export function SumitCardForm({
  planCode,
  planName,
  priceLabel,
  onSuccess,
  onCancel,
}: Props) {
  const formId = `sumit-card-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [jqReady, setJqReady] = useState(
    typeof window !== 'undefined' && Boolean(window.jQuery)
  )
  const [scriptReady, setScriptReady] = useState(
    typeof window !== 'undefined' && Boolean(window.OfficeGuy?.Payments?.CreateToken)
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Vendor jQuery onto window before payments.js loads (see file header).
  useEffect(() => {
    if (typeof window === 'undefined' || window.jQuery) {
      setJqReady(true)
      return
    }
    let cancelled = false
    import('jquery')
      .then((mod) => {
        if (cancelled) return
        window.jQuery = window.$ = mod.default
        setJqReady(true)
      })
      .catch(() => {
        if (!cancelled) setError('לא ניתן לטעון את שירות התשלום כרגע. נסי שוב מאוחר יותר.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const chargeWithToken = useCallback(
    async (token: string) => {
      try {
        const response = await fetch('/api/payments/subscription/charge', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ planCode, token }),
        })
        const payload = (await response.json().catch(() => null)) as
          | (CurrentSubscriptionView & { error?: string; detail?: string })
          | null
        if (!response.ok || !payload) {
          throw new Error(
            payload?.detail
              ? `${payload.error ?? 'התשלום נכשל'} (${payload.detail})`
              : payload?.error || 'התשלום נכשל. נסי שוב או פני לחברת האשראי.'
          )
        }
        onSuccess(payload)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'התשלום נכשל.')
        setBusy(false)
      }
    },
    [planCode, onSuccess]
  )

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setError(null)

      const createToken = window.OfficeGuy?.Payments?.CreateToken
      if (!createToken) {
        setError('טעינת טופס התשלום נכשלה. רענני את העמוד ונסי שוב.')
        return
      }

      setBusy(true)
      let settled = false
      const finish = (fn: () => void) => {
        if (settled) return
        settled = true
        window.clearTimeout(watchdog)
        fn()
      }
      // payments.js calls Callback(null) on a tokenization error and only
      // ResponseCallback on success — without a watchdog a failure hangs the
      // spinner forever.
      const watchdog = window.setTimeout(() => {
        finish(() => {
          setError('שירות התשלום לא הגיב. נסי שוב בעוד רגע.')
          setBusy(false)
        })
      }, 25000)

      createToken({
        CompanyID: COMPANY_ID,
        APIPublicKey: API_PUBLIC_KEY,
        FormSelector: `#${formId}`,
        ResponseLanguage: 'he',
        ErrorsClass: `#${formId} .og-errors`,
        ResponseCallback: (response) => {
          console.info('[sumit] CreateToken response', response)
          const token = response?.Data?.SingleUseToken
          if (response?.Status === 0 && token) {
            finish(() => void chargeWithToken(token))
            return
          }
          finish(() => {
            setError(
              response?.UserErrorMessage ||
                response?.TechnicalErrorDetails ||
                'פרטי הכרטיס לא אושרו. בדקי את הפרטים ונסי שוב.'
            )
            setBusy(false)
          })
        },
        Callback: (token) => {
          console.info('[sumit] CreateToken Callback token=', token)
          if (token) {
            finish(() => void chargeWithToken(token))
            return
          }
          finish(() => {
            setError('לא ניתן היה לאמת את פרטי הכרטיס. בדקי את המספר, התוקף ות"ז ונסי שוב.')
            setBusy(false)
          })
        },
      })
    },
    [chargeWithToken, formId]
  )

  const configured = Boolean(COMPANY_ID && API_PUBLIC_KEY)

  return (
    <div className="space-y-4 rounded-xl border border-[#7D3A52]/30 bg-white/80 p-5">
      {jqReady ? (
        <Script
          src={SCRIPT_URL}
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
          onError={() =>
            setError('לא ניתן לטעון את שירות התשלום כרגע. נסי שוב מאוחר יותר.')
          }
        />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[--foreground]">{planName}</p>
          <p className="text-sm text-[--muted]">{priceLabel} — חידוש אוטומטי</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-[--muted]">
          <Lock className="h-3.5 w-3.5" />
          תשלום מאובטח דרך SUMIT
        </span>
      </div>

      {!configured ? (
        <p className="text-sm text-red-700">
          טופס התשלום אינו מוגדר. פני לתמיכה.
        </p>
      ) : (
        <form
          id={formId}
          data-og="form"
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <label className="block text-sm">
            <span className="text-[--muted]">מספר כרטיס</span>
            <input
              data-og="cardnumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              className="mt-1 w-full rounded-lg border border-[--border]/70 bg-white px-3 py-2 text-right outline-none focus:border-[#7D3A52]"
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block text-sm">
              <span className="text-[--muted]">חודש</span>
              <input
                data-og="expirationmonth"
                inputMode="numeric"
                autoComplete="cc-exp-month"
                placeholder="MM"
                className="mt-1 w-full rounded-lg border border-[--border]/70 bg-white px-3 py-2 text-center outline-none focus:border-[#7D3A52]"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[--muted]">שנה</span>
              <input
                data-og="expirationyear"
                inputMode="numeric"
                autoComplete="cc-exp-year"
                placeholder="YYYY"
                className="mt-1 w-full rounded-lg border border-[--border]/70 bg-white px-3 py-2 text-center outline-none focus:border-[#7D3A52]"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[--muted]">CVV</span>
              <input
                data-og="cvv"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                className="mt-1 w-full rounded-lg border border-[--border]/70 bg-white px-3 py-2 text-center outline-none focus:border-[#7D3A52]"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-[--muted]">תעודת זהות של בעל/ת הכרטיס</span>
            <input
              data-og="citizenid"
              inputMode="numeric"
              placeholder="000000000"
              className="mt-1 w-full rounded-lg border border-[--border]/70 bg-white px-3 py-2 text-right outline-none focus:border-[#7D3A52]"
            />
          </label>

          <div className="og-errors text-sm text-red-700" />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" disabled={busy || !scriptReady}>
              {busy ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              {busy ? 'מעבד תשלום…' : 'הצטרפי למנוי'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
              ביטול
            </Button>
          </div>
          <p className="text-xs text-[--muted]">
            המנוי מתחדש אוטומטית בסוף כל תקופה. אפשר לבטל בכל עת מהעמוד הזה.
          </p>
        </form>
      )}
    </div>
  )
}
