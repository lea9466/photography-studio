import { NextRequest, NextResponse } from 'next/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { PaymentError } from '@/lib/payments/errors'
import {
  getPaymentReturnUrl,
  paymentErrorResponse,
  readSmallJson,
} from '@/lib/payments/http'
import {
  isOneTimePaymentEnabled,
  isPaymentsCheckoutAllowed,
  isPaymentsCheckoutEnabled,
  isPaymentsMaintenance,
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

    if (isPaymentsMaintenance()) throw new PaymentError('billing_not_initialized')

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
    const paymentService = createPaymentService()
    const successUrl = getPaymentReturnUrl('/dashboard/subscription?checkout=success')
    const cancelUrl = getPaymentReturnUrl('/dashboard/subscription?checkout=cancelled')

    let session
    if (body.paymentType === 'one_time') {
      if (!isOneTimePaymentEnabled()) throw new PaymentError('invalid_request')

      const months = typeof body.months === 'number' ? Math.trunc(body.months) : NaN
      if (!Number.isInteger(months) || months < 1 || months > 24) {
        throw new PaymentError('invalid_request')
      }

      session = await paymentService.createOneTimeCheckout({
        userId: context.userId,
        months,
        successUrl,
        cancelUrl,
      })
    } else {
      const planCode = typeof body.planCode === 'string' ? body.planCode.trim() : ''
      if (!/^[a-z0-9_]{1,64}$/.test(planCode)) {
        throw new PaymentError('invalid_request')
      }
      if (!isPaymentsCheckoutEnabled() && planCode !== 'studio_monthly') {
        throw new PaymentError('invalid_request')
      }

      session = await paymentService.createCheckout({
        userId: context.userId,
        planCode,
        successUrl,
        cancelUrl,
      })
    }

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
