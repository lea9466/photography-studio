'use client'

import { useState } from 'react'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CurrentSubscriptionView } from '@/lib/payments/payment-service'

type Props = {
  initialStatus: CurrentSubscriptionView
  isImpersonating: boolean
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין לאישור תשלום',
  active: 'פעיל',
  past_due: 'התשלום באיחור',
  payment_failed: 'התשלום נכשל',
  cancelled: 'בוטל',
  expired: 'הסתיים',
  paused: 'מושהה',
}

function formatPrice(amountAgorot: number, currency: string) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amountAgorot / 100)
}

function formatDate(value: string | null) {
  if (!value) return 'לא נקבע'
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(
    new Date(value)
  )
}

export function SubscriptionBillingPanel({
  initialStatus,
  isImpersonating,
}: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function callAction(path: string, body?: Record<string, unknown>) {
    setBusy(path)
    setMessage(null)
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const payload = (await response.json()) as {
        error?: string
        checkout?: { url?: string | null }
      }
      if (!response.ok) throw new Error(payload.error || 'הפעולה נכשלה')
      if (payload.checkout?.url) {
        window.location.assign(payload.checkout.url)
        return
      }

      const refreshed = await fetch('/api/payments/subscription', {
        cache: 'no-store',
      })
      if (refreshed.ok) {
        setStatus((await refreshed.json()) as CurrentSubscriptionView)
      }
      setMessage('הבקשה התקבלה.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'הפעולה נכשלה')
    } finally {
      setBusy(null)
    }
  }

  if (!status.configured) {
    return (
      <section className="rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 md:p-8">
        <div className="flex items-start gap-4">
          <CreditCard className="mt-0.5 h-5 w-5 text-[#7D3A52]" />
          <div>
            <h2 className="font-semibold text-[--foreground]">המנוי שלי</h2>
            <p className="mt-2 text-sm leading-relaxed text-[--muted]">
              התשלום ייפתח בימים הקרובים. תקופת הניסיון שלך ממשיכה לפעול כרגיל
              ואינה נפגעת.
            </p>
            <div className="mt-4">
              <Button type="button" disabled>
                זמין בקרוב
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const subscription = status.subscription
  const plan = subscription?.plan ?? status.availablePlan
  const isActive = subscription?.status === 'active'
  const checkoutEnabled = status.checkoutEnabled === true
  const canStartCheckout =
    checkoutEnabled && !subscription && Boolean(status.availablePlan)
  const showComingSoon =
    !checkoutEnabled && !isActive && Boolean(status.availablePlan || !subscription)
  const failed =
    subscription?.status === 'payment_failed' || subscription?.status === 'past_due'

  return (
    <section className="space-y-6 rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52]">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[--foreground]">המנוי שלי</h2>
          <p className="mt-1 text-sm text-[--muted]">
            ניהול מסלול החיוב ואמצעי התשלום
          </p>
        </div>
      </div>

      {plan ? (
        <div className="grid gap-4 rounded-xl border border-[--border]/60 bg-white/80 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[--muted]">מסלול</p>
            <p className="mt-1 font-semibold text-[--foreground]">{plan.name}</p>
          </div>
          <div>
            <p className="text-xs text-[--muted]">מחיר</p>
            <p className="mt-1 font-semibold text-[--foreground]">
              {formatPrice(plan.amountAgorot, plan.currency)} לחודש
            </p>
          </div>
          <div>
            <p className="text-xs text-[--muted]">סטטוס</p>
            <p className="mt-1 font-semibold text-[--foreground]">
              {subscription ? STATUS_LABELS[subscription.status] ?? subscription.status : 'ללא מינוי'}
            </p>
          </div>
          {subscription ? (
            <div className="sm:col-span-3">
              <p className="text-xs text-[--muted]">החיוב הבא</p>
              <p className="mt-1 text-sm text-[--foreground]">
                {formatDate(subscription.nextPaymentAt ?? subscription.currentPeriodEnd)}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[--muted]">אין כרגע מסלול פעיל להצטרפות.</p>
      )}

      {failed ? (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            החיוב האחרון לא הושלם. הנתונים שלך לא נמחקו והגישה אינה נחסמת מיד.
            ניתן לעדכן אמצעי תשלום לאחר חיבור PayMe.
          </p>
        </div>
      ) : null}

      {showComingSoon ? (
        <p className="text-sm leading-relaxed text-[--muted]">
          התשלום ייפתח בימים הקרובים.
          <br />
          תקופת הניסיון שלך ממשיכה לפעול כרגיל ואינה נפגעת.
        </p>
      ) : null}

      {canStartCheckout ? (
        <p className="text-sm leading-relaxed text-[--muted]">
          לא יתבצע חיוב אוטומטי ללא בחירתך והזנת אמצעי תשלום.
        </p>
      ) : null}

      {isActive ? (
        <p className="text-sm leading-relaxed text-[--muted]">
          המנוי שלך פעיל. אין צורך להצטרף מחדש.
        </p>
      ) : null}

      {message ? <p className="text-sm text-[--muted]">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        {showComingSoon ? (
          <Button type="button" disabled>
            זמין בקרוב
          </Button>
        ) : null}

        {canStartCheckout ? (
          <Button
            type="button"
            disabled={Boolean(busy) || isImpersonating}
            onClick={() =>
              callAction('/api/payments/checkout', {
                planCode: status.availablePlan?.code,
              })
            }
          >
            {busy === '/api/payments/checkout' ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : null}
            המשך למנוי
          </Button>
        ) : null}

        {checkoutEnabled && subscription ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(busy) || isImpersonating}
              onClick={() =>
                callAction('/api/payments/subscription/payment-method')
              }
            >
              עדכון אמצעי תשלום
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={
                Boolean(busy) ||
                isImpersonating ||
                subscription.cancelAtPeriodEnd ||
                subscription.status === 'cancelled'
              }
              onClick={() => callAction('/api/payments/subscription/cancel')}
            >
              ביטול מינוי
            </Button>
          </>
        ) : null}
      </div>

      {isImpersonating ? (
        <p className="text-xs text-[--muted]">
          פעולות חיוב מושבתות בזמן צפייה כמנהלת.
        </p>
      ) : null}
    </section>
  )
}
