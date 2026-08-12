import { NextRequest, NextResponse } from 'next/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { PaymentError } from '@/lib/payments/errors'
import {
  getPaymentReturnUrl,
  paymentErrorResponse,
  readSmallJson,
} from '@/lib/payments/http'
import {
  isPaymentsCheckoutAllowed,
  isPaymentsCheckoutEnabled,
  isPaymentsSmokeTestUser,
} from '@/lib/payments/flags'
import { createPaymentService } from '@/lib/payments/server'

export async function POST(request: NextRequest) {
  try {
    const context = await requireDashboardContext({
      allowWhenSiteUnavailable: true,
    }).catch(() => {
      throw new PaymentError('authentication_required')
    })

    const checkoutAllowed = isPaymentsCheckoutAllowed(context.userId)
    const isSmokeTestUser = isPaymentsSmokeTestUser(context.userId)
    const smokeTestEnvReady =
      process.env.PAYME_ENV === 'production' &&
      process.env.PAYME_API_BASE_URL === 'https://live.payme.io/api'

    if (!checkoutAllowed) {
      throw new PaymentError('billing_not_initialized')
    }
    if (isSmokeTestUser && !isPaymentsCheckoutEnabled() && !smokeTestEnvReady) {
      throw new PaymentError('billing_not_initialized')
    }
    if (context.isImpersonating) throw new PaymentError('forbidden')

    const body = await readSmallJson(request)
    const planCode = typeof body.planCode === 'string' ? body.planCode.trim() : ''
    if (!/^[a-z0-9_]{1,64}$/.test(planCode)) {
      throw new PaymentError('invalid_request')
    }

    if (!isPaymentsCheckoutEnabled() && planCode !== 'studio_monthly') {
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
