import { NextRequest, NextResponse } from 'next/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { PaymentError } from '@/lib/payments/errors'
import { paymentErrorResponse, readSmallJson } from '@/lib/payments/http'
import { isPaymentsMaintenance, isSumitPaymentsJsEnabled } from '@/lib/payments/flags'
import { createPaymentService } from '@/lib/payments/server'
import { checkPersistentRateLimit, getClientIp } from '@/lib/rate-limit/persistent'

// Card-testing guard: every call here is a real charge attempt against our
// SUMIT merchant account. A legitimate customer needs a handful of tries at
// most; a bot cycling stolen card numbers needs many.
const CHARGE_USER_MAX_ATTEMPTS = 5
const CHARGE_IP_MAX_ATTEMPTS = 15
const CHARGE_WINDOW_SECONDS = 60 * 60

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

    if (isPaymentsMaintenance(context.userId) || !isSumitPaymentsJsEnabled()) {
      throw new PaymentError('billing_not_initialized')
    }
    if (context.isImpersonating) throw new PaymentError('forbidden')

    const [userLimit, ipLimit] = await Promise.all([
      checkPersistentRateLimit(
        `payments-charge:user:${context.userId}`,
        CHARGE_USER_MAX_ATTEMPTS,
        CHARGE_WINDOW_SECONDS
      ),
      getClientIp().then((ip) =>
        checkPersistentRateLimit(
          `payments-charge:ip:${ip}`,
          CHARGE_IP_MAX_ATTEMPTS,
          CHARGE_WINDOW_SECONDS
        )
      ),
    ])
    if (!userLimit.allowed || !ipLimit.allowed) {
      throw new PaymentError('rate_limited')
    }

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
