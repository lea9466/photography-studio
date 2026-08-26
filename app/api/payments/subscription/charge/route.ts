import { NextRequest, NextResponse } from 'next/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { PaymentError } from '@/lib/payments/errors'
import { paymentErrorResponse, readSmallJson } from '@/lib/payments/http'
import { isSumitPaymentsJsEnabled } from '@/lib/payments/flags'
import { createPaymentService } from '@/lib/payments/server'

/**
 * SUMIT PaymentsJS recurring subscription — the client tokenizes the card
 * in-site (components/dashboard/subscription/SumitCardForm.tsx) and posts the
 * single-use `token` here. One server call charges it and opens the standing
 * order; the response is the refreshed subscription view.
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireDashboardContext({
      allowWhenSiteUnavailable: true,
    }).catch(() => {
      throw new PaymentError('authentication_required')
    })

    if (!isSumitPaymentsJsEnabled()) throw new PaymentError('billing_not_initialized')
    if (context.isImpersonating) throw new PaymentError('forbidden')

    const body = await readSmallJson(request)
    const planCode = typeof body.planCode === 'string' ? body.planCode.trim() : ''
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (!/^[a-z0-9_]{1,64}$/.test(planCode)) throw new PaymentError('invalid_request')
    if (token.length < 8 || token.length > 512) throw new PaymentError('invalid_request')

    const status = await createPaymentService().subscribeWithToken({
      userId: context.userId,
      planCode,
      token,
    })

    return NextResponse.json(status)
  } catch (error) {
    return paymentErrorResponse(error)
  }
}
