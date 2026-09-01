'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Images, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SumitCardForm } from '@/components/dashboard/subscription/SumitCardForm'
import type { CurrentSubscriptionView, PlanView } from '@/lib/payments/payment-service'
import type { PrivateGalleryTier } from '@/lib/private-galleries/types'

type Quota = {
  tier: PrivateGalleryTier
  galleryCount: number
  maxGalleries: number
  maxPhotosPerGallery: number
  isLifetime: boolean
  canCreateGallery: boolean
} | null

type Props = {
  initialStatus: CurrentSubscriptionView
  quota: Quota
  isImpersonating: boolean
  /** Separate rollout kill switch (lib/payments/flags.ts isPrivateGalleryCheckoutEnabled) — the shared public-site checkout flags are already live and are not product-specific. */
  checkoutEnabled: boolean
}

const TIER_LABELS: Record<PrivateGalleryTier, string> = {
  free: 'חינם',
  starter: 'Starter',
  pro: 'Pro',
  unlimited: 'Unlimited',
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

function formatDate(value: string | null) {
  if (!value) return 'לא נקבע'
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(value))
}

export function PrivateGalleriesSubscriptionPanel({
  initialStatus,
  quota,
  isImpersonating,
  checkoutEnabled,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [cardFormPlanCode, setCardFormPlanCode] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!status.configured) return null

  const subscription = status.subscription
  const isActive = subscription?.status === 'active'
  const plans: PlanView[] = status.availablePlans ?? []
  const tier = quota?.tier ?? 'free'

  async function cancel() {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/payments/private-galleries/subscription/cancel', {
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error || 'הביטול נכשל')
      const refreshed = await fetch('/api/payments/private-galleries/subscription', {
        cache: 'no-store',
      })
      if (refreshed.ok) setStatus((await refreshed.json()) as CurrentSubscriptionView)
      setMessage('המסלול יבוטל בתום תקופת החיוב הנוכחית — הגלריות שלך יישארו כמות שהן.')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'הביטול נכשל')
    } finally {
      setBusy(false)
    }
  }

  function onSubscribeSuccess(view: CurrentSubscriptionView) {
    setStatus(view)
    setCardFormPlanCode(null)
    setMessage('התשלום הצליח! המסלול פעיל.')
    router.refresh()
  }

  return (
    <section className="space-y-6 rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52]">
          <Images className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[--foreground]">גלריות פרטיות</h2>
          <p className="mt-1 text-sm text-[--muted]">
            מסלול נפרד לגמרי מהמנוי לאתר הציבורי — קובע כמה גלריות לקוח אפשר לנהל ובאיזה גודל.
          </p>
        </div>
      </div>

      {quota ? (
        <div className="grid gap-4 rounded-xl border border-[--border]/60 bg-white/80 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[--muted]">מסלול נוכחי</p>
            <p className="mt-1 font-semibold text-[--foreground]">{TIER_LABELS[tier]}</p>
          </div>
          <div>
            <p className="text-xs text-[--muted]">
              {quota.isLifetime ? 'גלריות (לכל החיים)' : 'גלריות פעילות'}
            </p>
            <p className="mt-1 font-semibold text-[--foreground]">
              {quota.galleryCount} מתוך {quota.maxGalleries}
            </p>
          </div>
          <div>
            <p className="text-xs text-[--muted]">תמונות לגלריה</p>
            <p className="mt-1 font-semibold text-[--foreground]">עד {quota.maxPhotosPerGallery}</p>
          </div>
          {isActive && subscription ? (
            <div className="sm:col-span-3">
              <p className="text-xs text-[--muted]">
                {subscription.cancelAtPeriodEnd ? 'פעיל עד' : 'החיוב הבא'}
              </p>
              <p className="mt-1 text-sm text-[--foreground]">
                {formatDate(subscription.cancelAtPeriodEnd ? subscription.currentPeriodEnd : subscription.nextPaymentAt)}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {isActive && subscription?.plan ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[--border]/50 bg-white/70 px-4 py-3.5">
          <p className="text-sm text-[--foreground]">
            {subscription.plan.name} · {formatPrice(subscription.plan.amountAgorot, subscription.plan.currency)} לחודש
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || isImpersonating || subscription.cancelAtPeriodEnd}
            onClick={cancel}
          >
            ביטול מסלול
          </Button>
        </div>
      ) : plans.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-[--muted]">מסלולים בתשלום:</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => {
              const canCheckoutThisPlan = checkoutEnabled && status.paymentsFormEnabled
              return (
                <div key={plan.code} className="rounded-xl border border-[--border]/60 bg-white/80 p-5 text-right">
                  <p className="font-semibold text-[--foreground]">{plan.name}</p>
                  <p className="mt-2 text-lg font-bold text-[--foreground]">
                    {formatPrice(plan.amountAgorot, plan.currency)}{' '}
                    <span className="text-sm font-medium text-[--muted]">לחודש</span>
                  </p>
                  <div className="mt-4">
                    {!canCheckoutThisPlan ? (
                      <Button type="button" className="w-full" disabled>
                        בקרוב
                      </Button>
                    ) : cardFormPlanCode === plan.code ? (
                      <SumitCardForm
                        planCode={plan.code}
                        planName={plan.name}
                        priceLabel={`${formatPrice(plan.amountAgorot, plan.currency)} לחודש`}
                        onSuccess={onSubscribeSuccess}
                        onCancel={() => setCardFormPlanCode(null)}
                      />
                    ) : (
                      <Button
                        type="button"
                        className="w-full"
                        disabled={isImpersonating || cardFormPlanCode !== null}
                        onClick={() => setCardFormPlanCode(plan.code)}
                      >
                        שדרוג
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {!checkoutEnabled || !status.paymentsFormEnabled ? (
            <p className="text-xs text-[--muted]">
              התשלום בפועל עוד לא פעיל — המסלולים כאן להצגה בלבד בשלב זה.
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <div className="flex gap-3 rounded-xl border border-[--border]/60 bg-white/70 p-4 text-sm text-[--foreground]">
          {message.includes('הצליח') ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-[#7D3A52]" />
          )}
          <p>{message}</p>
        </div>
      ) : null}

      {busy ? <Loader2 className="h-4 w-4 animate-spin text-[--muted]" /> : null}

      {isImpersonating ? (
        <p className="text-xs text-[--muted]">פעולות חיוב מושבתות בזמן צפייה כמנהלת.</p>
      ) : null}
    </section>
  )
}
