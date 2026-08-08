import { NextRequest, NextResponse } from 'next/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { PaymentError } from '@/lib/payments/errors'
import { isPaymentsCheckoutEnabled } from '@/lib/payments/flags'
import {
  getPaymentReturnUrl,
  paymentErrorResponse,
  readSmallJson,
} from '@/lib/payments/http'
import { createPaymentService } from '@/lib/payments/server'

export async function POST(request: NextRequest) {
  try {
    if (!isPaymentsCheckoutEnabled()) {
      throw new PaymentError('billing_not_initialized')
    }

    const context = await requireDashboardContext({
      allowWhenSiteUnavailable: true,
    }).catch(() => {
      throw new PaymentError('authentication_required')
    })
    if (context.isImpersonating) throw new PaymentError('forbidden')

    const body = await readSmallJson(request)
    const planCode = typeof body.planCode === 'string' ? body.planCode.trim() : ''
    if (!/^[a-z0-9_]{1,64}$/.test(planCode)) {
      throw new PaymentError('invalid_request')
    }

    const session = await createPaymentService().createCheckout({
      userId: context.userId,
      planCode,
      successUrl: getPaymentReturnUrl('/dashboard/subscription?checkout=success'),
      cancelUrl: getPaymentReturnUrl('/dashboard/subscription?checkout=cancelled'),
    })

    return NextResponse.json({
      checkout: {
        url: session.url,
        token: session.token,
        expiresAt: session.expiresAt,
      },
    })
  } catch (error) {
    return paymentErrorResponse(error)
  }
}
