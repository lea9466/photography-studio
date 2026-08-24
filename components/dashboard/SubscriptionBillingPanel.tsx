'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CurrentSubscriptionView, PlanView } from '@/lib/payments/payment-service'

type Props = {
  initialStatus: CurrentSubscriptionView
  isImpersonating: boolean
  checkoutSuccess?: boolean
  checkoutError?: boolean
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
  const value = amountAgorot / 100
  const fractionDigits = Number.isInteger(value) ? 0 : 2
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

function formatInterval(plan: PlanView) {
  return plan.billingInterval === 'year' ? 'לשנה' : 'לחודש'
}

function formatDate(value: string | null) {
  if (!value) return 'לא נקבע'
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(
    new Date(value)
  )
}

/**
 * End of the current paid period — i.e. until when access continues after a
 * cancellation. The stored period-end is sometimes missing/unset, so we derive
 * it from the period start / last payment + the billing interval when needed.
 */
function computeActiveUntil(
  subscription: NonNullable<CurrentSubscriptionView['subscription']>
): string {
  const interval = subscription.plan?.billingInterval
  const addInterval = (date: Date) => {
    const next = new Date(date)
    if (interval === 'year') next.setFullYear(next.getFullYear() + 1)
    else next.setMonth(next.getMonth() + 1)
    return next
  }

  if (subscription.currentPeriodEnd) {
    const end = new Date(subscription.currentPeriodEnd)
    if (!Number.isNaN(end.getTime()) && end.getTime() > Date.now()) {
      return formatDate(subscription.currentPeriodEnd)
    }
  }
  for (const raw of [subscription.currentPeriodStart, subscription.lastPaymentAt]) {
    if (raw) {
      const base = new Date(raw)
      if (!Number.isNaN(base.getTime())) {
        return formatDate(addInterval(base).toISOString())
      }
    }
  }
  return formatDate(addInterval(new Date()).toISOString())
}

export function SubscriptionBillingPanel({
  initialStatus,
  isImpersonating,
  checkoutSuccess,
  checkoutError,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>(
    initialStatus.availablePlans?.find((plan) => plan.code === 'studio_yearly')
      ?.code ??
    initialStatus.availablePlans?.[0]?.code ??
    initialStatus.availablePlan?.code ??
    'studio_monthly'
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [oneTimeMonths, setOneTimeMonths] = useState(1)

  useEffect(() => {
    if (checkoutSuccess) router.refresh()
  }, [checkoutSuccess, router])

  async function callAction(path: string, body?: Record<string, unknown>) {
    setBusy(path)
    setMessage(null)
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      let payload: {
        error?: string
        detail?: string
        checkout?: { url?: string | null }
      }
      try {
        payload = (await response.json()) as typeof payload
      } catch {
        throw new Error('הפעולה נכשלה. נסי שוב בעוד רגע או צרי קשר בתמיכה.')
      }
      if (!response.ok) {
        const msg = payload.detail
          ? `${payload.error ?? 'הפעולה נכשלה'} (${payload.detail})`
          : payload.error || 'הפעולה נכשלה'
        throw new Error(msg)
      }
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
      setMessage('המינוי יבוטל בתום תקופת החיוב הנוכחית — תהני מגישה מלאה עד לתום התקופה.')
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
  const availablePlans =
    status.availablePlans?.length > 0
      ? status.availablePlans
      : status.availablePlan
        ? [status.availablePlan]
        : []
  const smokeTestPlans = status.isSmokeTestUser && !status.checkoutEnabled
    ? availablePlans.filter((plan) => plan.code === 'studio_monthly')
    : availablePlans
  const selectedPlan =
    smokeTestPlans.find((plan) => plan.code === selectedPlanCode) ??
    smokeTestPlans[0] ??
    null
  const monthlyPlan =
    availablePlans.find((plan) => plan.billingInterval === 'month') ?? null
  const yearlyPlan =
    availablePlans.find((plan) => plan.billingInterval === 'year') ?? null
  // 12 months prices like the yearly plan's discounted rate, not monthly × 12
  // — mirrors lib/payments/payment-service.ts `createOneTimeCheckout`.
  const oneTimeAmountAgorot =
    oneTimeMonths === 12 && yearlyPlan
      ? yearlyPlan.amountAgorot
      : (monthlyPlan?.amountAgorot ?? 0) * oneTimeMonths
  const activePlan = subscription?.plan ?? null
  const isActive = subscription?.status === 'active'
  const checkoutEnabled =
    status.checkoutEnabled === true || status.isSmokeTestUser === true
  // Only a genuinely active subscription blocks a new checkout. A pending
  // (never completed) attempt never blocks one — see canStartNewCheckout.
  const blockCheckout = status.canStartNewCheckout === false
  const showComingSoon =
    !checkoutEnabled && !isActive && (smokeTestPlans.length > 0 || !subscription)
  const failed =
    subscription?.status === 'payment_failed' || subscription?.status === 'past_due'

  return (
    <section className="space-y-6 rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 md:p-8">
      {checkoutSuccess && subscription?.status === 'active' ? (
        <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>התשלום הצליח! המינוי שלך פעיל.</p>
        </div>
      ) : null}
      {checkoutError ? (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            התשלום לא אושר או שלא ניתן היה להשלים את המינוי. נסי כרטיס אחר או
            פני לחברת האשראי.
          </p>
        </div>
      ) : null}
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

      {subscription?.status === 'active' && activePlan ? (
        <div className="grid gap-4 rounded-xl border border-[--border]/60 bg-white/80 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[--muted]">מסלול</p>
            <p className="mt-1 font-semibold text-[--foreground]">{activePlan.name}</p>
          </div>
          <div>
            <p className="text-xs text-[--muted]">מחיר</p>
            <p className="mt-1 font-semibold text-[--foreground]">
              {formatPrice(activePlan.amountAgorot, activePlan.currency)}{' '}
              {formatInterval(activePlan)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[--muted]">סטטוס</p>
            <p className="mt-1 font-semibold text-[--foreground]">
              {subscription.cancelAtPeriodEnd
                ? `פעיל עד ${computeActiveUntil(subscription)}`
                : STATUS_LABELS[subscription.status] ?? subscription.status}
            </p>
          </div>
          {subscription ? (
            <div className="sm:col-span-3">
              <p className="text-xs text-[--muted]">
                {subscription.paymentType === 'one_time'
                  ? 'המנוי פעיל עד'
                  : subscription.cancelAtPeriodEnd
                    ? 'הגישה פעילה עד'
                    : 'החיוב הבא'}
              </p>
              <p className="mt-1 text-sm text-[--foreground]">
                {computeActiveUntil(subscription)}
              </p>
              {subscription.paymentType === 'one_time' ? (
                <p className="mt-1 text-xs text-[--muted]">
                  תשלום חד-פעמי — לא יתבצע חיוב אוטומטי בתום התקופה
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : availablePlans.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-[--muted]">בחרי מסלול מינוי:</p>
          <div className="grid gap-3 sm:grid-cols-2">
              {smokeTestPlans.map((plan) => {
                const selected = selectedPlan?.code === plan.code
                const monthlyPlan = smokeTestPlans.find(
                  (p) => p.billingInterval === 'month'
                )
                const yearlySavings =
                  plan.billingInterval === 'year' && monthlyPlan
                    ? monthlyPlan.amountAgorot * 12 - plan.amountAgorot
                    : null
                 const planDisabled =
                 !checkoutEnabled || blockCheckout
              return (
                <div
                  key={plan.code}
                  className={`rounded-xl border p-5 text-right ${selected
                      ? 'border-[#7D3A52] bg-[#7D3A52]/5 ring-1 ring-[#7D3A52]/30'
                      : plan.isHighlighted
                        ? 'border-[#7D3A52]/40 bg-[#7D3A52]/5'
                        : 'border-[--border]/60 bg-white/80'
                    }`}
                >
                  <button
                    type="button"
                    disabled={planDisabled}
                    onClick={() => setSelectedPlanCode(plan.code)}
                    className="w-full text-right disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[--foreground]">
                          {plan.name}
                        </p>
                        <p className="mt-2 flex flex-wrap items-baseline gap-2 text-lg font-bold text-[--foreground]">
                          {plan.compareAtAgorot && plan.compareAtAgorot > plan.amountAgorot ? (
                            <span className="text-sm font-medium text-[--muted] line-through decoration-1">
                              {formatPrice(plan.compareAtAgorot, plan.currency)}
                            </span>
                          ) : null}
                          <span>{formatPrice(plan.amountAgorot, plan.currency)}</span>
                          <span className="text-sm font-medium text-[--muted]">
                            {formatInterval(plan)}
                          </span>
                        </p>
                        {plan.billingInterval === 'year' ? (
                          <p className="mt-1 text-xs text-[--muted]">
                            יוצא{' '}
                            {formatPrice(
                              Math.round(plan.amountAgorot / 12),
                              plan.currency
                            )}{' '}
                            לחודש
                          </p>
                        ) : null}
                        {yearlySavings != null ? (
                          <p className="mt-2 text-xs leading-relaxed text-[--muted]">
                            חיסכון של {formatPrice(yearlySavings, plan.currency)} בשנה
                            לעומת המסלול החודשי
                          </p>
                        ) : null}
                      </div>
                      {plan.badge ? (
                        <span className="shrink-0 rounded-full bg-[#7D3A52]/10 px-2.5 py-1 text-[11px] font-semibold text-[#7D3A52]">
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>
                  </button>
                  <div className="mt-4">
                    {!checkoutEnabled ? (
                      <Button type="button" disabled className="w-full">
                        זמין בקרוב
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="w-full"
                        disabled={
                          Boolean(busy) ||
                          isImpersonating ||
                          blockCheckout
                        }
                        onClick={() =>
                          callAction('/api/payments/checkout', {
                            planCode: plan.code,
                          })
                        }
                      >
                        {busy === '/api/payments/checkout' &&
                          selectedPlanCode === plan.code ? (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : null}
                        המשך לתשלום
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {checkoutEnabled && status.oneTimePaymentEnabled && monthlyPlan ? (
            <div className="space-y-4 rounded-2xl border border-[--border]/60 bg-gradient-to-br from-[#7D3A52]/[0.06] to-transparent p-5 md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7D3A52]/10 text-[#7D3A52]">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-[--foreground]">
                    משלמת בדיירקט?
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[--muted]">
                    כרטיסי דיירקט לא תומכים בהרשאה לחיוב חוזר, אז התשלום הרגיל
                    למעלה עלול להיכשל. כדאי לנסות אותו קודם — ואם זה לא
                    מסתדר, אפשר לשלם כאן מראש לכמה חודשים.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2 pt-3">
                {[1, 3, 6, 12].map((count) => {
                  const isSelected = oneTimeMonths === count
                  const isRecommended = count === 12
                  const price =
                    count === 12 && yearlyPlan
                      ? yearlyPlan.amountAgorot
                      : monthlyPlan.amountAgorot * count
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setOneTimeMonths(count)}
                      className={`relative flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border px-4 py-2 transition-all ${isSelected
                          ? 'border-[#7D3A52] bg-[#7D3A52] text-white shadow-sm'
                          : 'border-[--border]/60 bg-white/70 text-[--foreground] hover:border-[#7D3A52]/40 hover:bg-[#7D3A52]/5'
                        }`}
                    >
                      {isRecommended ? (
                        <span
                          className={`absolute -top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isSelected ? 'bg-white text-[#7D3A52]' : 'bg-[#7D3A52] text-white'
                            }`}
                        >
                          מומלץ
                        </span>
                      ) : null}
                      <span className="text-sm font-medium">
                        {count === 1 ? 'חודש' : count === 12 ? 'שנה' : `${count} חודשים`}
                      </span>
                      <span
                        className={`text-xs ${isSelected ? 'text-white/80' : 'text-[--muted]'}`}
                      >
                        {formatPrice(price, monthlyPlan.currency)}
                      </span>
                    </button>
                  )
                })}
                <label className="flex items-center gap-2 rounded-full border border-dashed border-[--border]/60 bg-white/50 py-1 pe-3.5 ps-1 text-sm text-[--muted]">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={oneTimeMonths}
                    onChange={(event) => {
                      const value = Math.trunc(Number(event.target.value))
                      if (Number.isFinite(value)) {
                        setOneTimeMonths(Math.min(24, Math.max(1, value)))
                      }
                    }}
                    className="w-12 rounded-full bg-transparent text-center font-medium text-[--foreground] outline-none"
                  />
                  מספר חודשים מותאם
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[--border]/50 bg-white/80 px-4 py-3.5 md:px-5">
                <div>
                  <p className="text-xs text-[--muted]">סה&quot;כ לתשלום</p>
                  <p className="mt-0.5 text-2xl font-bold text-[--foreground]">
                    {formatPrice(oneTimeAmountAgorot, monthlyPlan.currency)}
                  </p>
                  <p className="mt-0.5 text-xs text-[--muted]">
                    עבור{' '}
                    {oneTimeMonths === 1
                      ? 'חודש אחד'
                      : oneTimeMonths === 12
                        ? 'שנה שלמה'
                        : `${oneTimeMonths} חודשים`}
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={Boolean(busy) || isImpersonating || blockCheckout}
                  onClick={() =>
                    callAction('/api/payments/checkout', {
                      paymentType: 'one_time',
                      months: oneTimeMonths,
                    })
                  }
                >
                  {busy === '/api/payments/checkout' ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : null}
                  המשך בתשלום חד-פעמי
                </Button>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  בתשלום חד-פעמי המנוי לא מתחדש אוטומטית — יהיה צריך לחדש
                  ידנית בתום התקופה שנבחרה.
                </p>
              </div>
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
            ניתן לעדכן אמצעי תשלום למטה.
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

      {checkoutEnabled && !subscription && smokeTestPlans.length > 0 ? (
        <p className="text-sm leading-relaxed text-[--muted]">
          לא יתבצע חיוב אוטומטי ללא בחירתך והזנת אמצעי תשלום.
        </p>
      ) : null}

      {isActive ? (
        <p className="text-sm leading-relaxed text-[--muted]">
          המנוי שלך פעיל. אין צורך להצטרף מחדש.
        </p>
      ) : null}

      {subscription?.cancelAtPeriodEnd ? (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            המינוי יבוטל בתום תקופת החיוב הנוכחית. תהני מגישה מלאה עד לתאריך{' '}
            {computeActiveUntil(subscription)} — לא יחויבו חיובים נוספים.
          </p>
        </div>
      ) : null}

      {message ? <p className="text-sm text-[--muted]">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        {checkoutEnabled && isActive ? (
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
