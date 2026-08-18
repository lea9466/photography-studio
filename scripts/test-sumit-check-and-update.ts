process.env.PAYMENT_PROVIDER = 'sumit'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001'

import { SumitProvider } from '../lib/payments/providers/sumit/sumit-provider'
import { createPaymentService } from '../lib/payments/server'

async function run() {
  const provider = new SumitProvider()
  const compositeId = '2254497565:2254499270'

  console.log('[check] fetching real next-billing date for the new active subscription...')
  const subscription = await provider.getSubscription(compositeId)
  console.log('[check] subscription:', subscription)

  console.log('[check] generating an update-payment-method link via the full service path...')
  const service = createPaymentService()
  const session = await service.updatePaymentMethod(
    'a1c962ae-79fd-4c45-853f-b0b5b2f2aa06',
    'http://localhost:3001/dashboard/subscription?payment_method=updated'
  )
  console.log('[check] update-payment-method session:', session)
}

void run().catch((error) => {
  console.error('[check] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    detail: (error as { detail?: string })?.detail,
  })
  process.exitCode = 1
})
