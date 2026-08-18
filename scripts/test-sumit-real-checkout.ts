process.env.PAYMENT_PROVIDER = 'sumit'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001'

import { createPaymentService } from '../lib/payments/server'

async function run() {
  const service = createPaymentService()
  const session = await service.createCheckout({
    userId: 'a1c962ae-79fd-4c45-853f-b0b5b2f2aa06',
    planCode: 'studio_monthly',
    successUrl: 'http://localhost:3001/dashboard/subscription?checkout=success',
    cancelUrl: 'http://localhost:3001/dashboard/subscription?checkout=cancelled',
  })
  console.log('[real-checkout] session:', session)
}

void run().catch((error) => {
  console.error('[real-checkout] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    detail: (error as { detail?: string })?.detail,
  })
  process.exitCode = 1
})
