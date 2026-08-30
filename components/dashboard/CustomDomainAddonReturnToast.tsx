'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Surfaces a toast after the browser returns from the SUMIT hosted checkout
 * for the custom-domain addon (?checkout=success|cancelled|error — the same
 * param name/values every other SUMIT redirect flow uses, set by the
 * successUrl/cancelUrl in app/api/payments/checkout/route.ts's
 * custom_domain_addon branch; see that route for why it's `checkout` and not
 * a dedicated `addon` key), then strips the query param so a refresh doesn't
 * re-show it. Unambiguous here since nothing else ever redirects to
 * /dashboard/custom-domain. The actual entitlement grant already happened
 * server-side (SUMIT return route) before this redirect ever lands — this is
 * purely a confirmation message, not part of the trust chain.
 */
export function CustomDomainAddonReturnToast() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (!checkout) return

    if (checkout === 'success') {
      toast.success('התשלום הצליח! דומיין אישי פתוח עכשיו.')
    } else if (checkout === 'cancelled') {
      toast.info('התשלום בוטל — לא חויבת.')
    } else if (checkout === 'error') {
      toast.error('משהו השתבש בתשלום. נסי שוב או צרי קשר.')
    }

    const url = new URL(window.location.href)
    url.searchParams.delete('checkout')
    router.replace(url.pathname + url.search, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
