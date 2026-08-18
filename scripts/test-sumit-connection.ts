import { SumitProvider } from '../lib/payments/providers/sumit/sumit-provider'

async function run() {
  const provider = new SumitProvider()

  console.log('[sumit-test] creating a test customer...')
  const customer = await provider.createCustomer({
    userId: 'sumit-integration-test',
    email: 'sumit-integration-test@studio-galleries.com',
  })
  console.log('[sumit-test] customer created:', customer)

  console.log('[sumit-test] requesting a checkout session (₪1, AuthoriseOnly since SUMIT_TEST_MODE=true)...')
  const session = await provider.createCheckoutSession({
    userId: 'sumit-integration-test',
    customer,
    plan: {
      id: 'test-plan',
      code: 'studio_monthly',
      name: 'Studio Galleries — בדיקת חיבור',
      description: null,
      amountAgorot: 100,
      currency: 'ILS',
      billingInterval: 'month',
      providerPlanId: null,
    },
    successUrl: 'https://studio-galleries.com/dashboard/subscription?checkout=success',
    cancelUrl: 'https://studio-galleries.com/dashboard/subscription?checkout=cancelled',
  })
  console.log('[sumit-test] checkout session created:', session)
  console.log('[sumit-test] SUCCESS — open the url above in a browser to see the hosted SUMIT page.')
}

void run().catch((error) => {
  console.error('[sumit-test] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    detail: (error as { detail?: string })?.detail,
    cause: error instanceof Error ? error.cause : undefined,
  })
  process.exitCode = 1
})
