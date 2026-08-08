import { NextResponse } from 'next/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { PaymentError } from '@/lib/payments/errors'
import { paymentErrorResponse } from '@/lib/payments/http'
import { createPaymentService } from '@/lib/payments/server'

export async function POST() {
  try {
    const context = await requireDashboardContext({
      allowWhenSiteUnavailable: true,
    }).catch(() => {
      throw new PaymentError('authentication_required')
    })
    if (context.isImpersonating) throw new PaymentError('forbidden')

    const subscription = await createPaymentService().cancelSubscription(context.userId)
    return NextResponse.json({
      subscription: {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
      },
    })
  } catch (error) {
    return paymentErrorResponse(error)
  }
}
