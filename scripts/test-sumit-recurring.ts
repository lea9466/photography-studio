import { SumitProvider } from '../lib/payments/providers/sumit/sumit-provider'
import { SumitClient } from '../lib/payments/providers/sumit/sumit-client'

async function run() {
  const provider = new SumitProvider()
  const customerId = process.argv[2]
  const token = process.argv[3]
  if (!customerId || !token) {
    throw new Error('Usage: tsx scripts/test-sumit-recurring.ts <CustomerID> <CreditCard_Token>')
  }

  console.log('[sumit-recurring] establishing recurring authorization via createSubscription...')
  const subscription = await provider.createSubscription({
    customerId,
    plan: {
      id: 'test-plan',
      code: 'studio_monthly',
      name: 'Studio Galleries — בדיקת חיוב חוזר',
      description: null,
      amountAgorot: 100,
      currency: 'ILS',
      billingInterval: 'month',
      providerPlanId: null,
    },
    paymentToken: token,
  })
  console.log('[sumit-recurring] createSubscription result:', subscription)

  console.log('[sumit-recurring] listing recurring items for customer via raw API...')
  const client = new SumitClient()
  const listResponse = await client.postJson('/billing/recurring/listforcustomer/', {
    Customer: { ID: Number(customerId) },
    IncludeInactive: 'true',
  })
  console.log('[sumit-recurring] raw listforcustomer response:')
  console.log(JSON.stringify(listResponse, null, 2))
}

void run().catch((error) => {
  console.error('[sumit-recurring] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    detail: (error as { detail?: string })?.detail,
  })
  process.exitCode = 1
})
