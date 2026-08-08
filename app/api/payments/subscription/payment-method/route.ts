import { NextResponse } from 'next/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { PaymentError } from '@/lib/payments/errors'
import { getPaymentReturnUrl, paymentErrorResponse } from '@/lib/payments/http'
import { createPaymentService } from '@/lib/payments/server'

export async function POST() {
  try {
    const context = await requireDashboardContext({
      allowWhenSiteUnavailable: true,
    }).catch(() => {
      throw new PaymentError('authentication_required')
    })
    if (context.isImpersonating) throw new PaymentError('forbidden')

    const session = await createPaymentService().updatePaymentMethod(
      context.userId,
      getPaymentReturnUrl('/dashboard/subscription?payment_method=updated')
    )

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
