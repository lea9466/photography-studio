import { NextResponse } from 'next/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import {
  isMissingBillingSchemaError,
  PaymentError,
} from '@/lib/payments/errors'
import { paymentErrorResponse } from '@/lib/payments/http'
import { createPaymentService } from '@/lib/payments/server'

export async function GET() {
  let userId: string
  try {
    userId = (
      await requireDashboardContext({ allowWhenSiteUnavailable: true })
    ).userId
  } catch {
    return paymentErrorResponse(new PaymentError('authentication_required'))
  }

  try {
    const status = await createPaymentService().getCurrentSubscription(userId)
    return NextResponse.json(status)
  } catch (error) {
    if (isMissingBillingSchemaError(error)) {
      return NextResponse.json({
        configured: false,
        checkoutEnabled: false,
        subscription: null,
        availablePlan: null,
      })
    }
    return paymentErrorResponse(error)
  }
}
