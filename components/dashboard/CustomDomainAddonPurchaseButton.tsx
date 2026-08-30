'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type CustomDomainAddonPurchaseButtonProps = {
  priceLabel: string
  className?: string
}

/**
 * Kicks off the standalone one-time addon checkout (see
 * lib/payments/payment-service.ts's createCustomDomainAddonCheckout) and
 * redirects the browser to SUMIT's hosted payment page — same
 * fetch-then-redirect shape as SubscriptionBillingPanel's `callAction`, just
 * scoped to this one purchase instead of the whole plan-selection flow.
 */
export function CustomDomainAddonPurchaseButton({
  priceLabel,
  className,
}: CustomDomainAddonPurchaseButtonProps) {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ paymentType: 'custom_domain_addon' }),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        detail?: string
        checkout?: { url?: string | null }
      }
      if (!response.ok || !payload.checkout?.url) {
        const msg = payload.detail
          ? `${payload.error ?? 'הפעולה נכשלה'} (${payload.detail})`
          : payload.error || 'הפעולה נכשלה'
        throw new Error(msg)
      }
      window.location.assign(payload.checkout.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'הפעולה נכשלה')
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={pending}
      className={className}
    >
      {pending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
      פתחי דומיין אישי בנפרד — {priceLabel} חד-פעמי
    </Button>
  )
}
