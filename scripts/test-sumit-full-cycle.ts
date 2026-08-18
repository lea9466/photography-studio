import { SumitProvider } from '../lib/payments/providers/sumit/sumit-provider'
import { SumitClient } from '../lib/payments/providers/sumit/sumit-client'

async function run() {
  const provider = new SumitProvider()
  const customerId = process.argv[2]
  const token = process.argv[3]
  const expMonth = process.argv[4]
  const expYear = process.argv[5]

  console.log('[full-cycle] establishing a fresh recurring authorization (raw client, with expiration)...')
  const client = new SumitClient()
  const chargeResponse = await client.postJson<Record<string, unknown>>('/billing/recurring/charge/', {
    Customer: { ID: Number(customerId) },
    PaymentMethod: {
      CreditCard_Token: token,
      CreditCard_ExpirationMonth: Number(expMonth),
      CreditCard_ExpirationYear: Number(expYear),
      Type: 1,
    },
    Items: [
      {
        Item: { Name: 'Studio Galleries — full cycle test', SearchMode: 'Automatic' },
        Quantity: 1,
        UnitPrice: 1,
        Currency: 'ILS',
      },
    ],
    VATIncluded: 'true',
    SendDocumentByEmail: 'false',
    DocumentDescription: 'full cycle test',
    DocumentLanguage: 'Hebrew',
  })
  console.log('[full-cycle] raw charge response:', JSON.stringify(chargeResponse))

  // Re-map through the real provider mapper to get the composite id our own code would store.
  const { mapSumitFirstRecurringCharge } = await import('../lib/payments/providers/sumit/sumit-mapper')
  const subscription = mapSumitFirstRecurringCharge(chargeResponse as never)
  console.log('[full-cycle] mapped PaymentSubscription (this is what gets stored as provider_subscription_id):', subscription)

  console.log('[full-cycle] calling provider.getSubscription with the composite id...')
  const fetched = await provider.getSubscription(subscription.id)
  console.log('[full-cycle] getSubscription result:', fetched)

  console.log('[full-cycle] calling provider.cancelSubscription with the composite id...')
  const cancelled = await provider.cancelSubscription({
    externalSubscriptionId: subscription.id,
    atPeriodEnd: false,
  })
  console.log('[full-cycle] cancelSubscription result:', cancelled)

  console.log('[full-cycle] calling provider.getSubscription again to confirm the cancelled state is visible...')
  const fetchedAfterCancel = await provider.getSubscription(subscription.id)
  console.log('[full-cycle] getSubscription after cancel:', fetchedAfterCancel)
}

void run().catch((error) => {
  console.error('[full-cycle] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    detail: (error as { detail?: string })?.detail,
  })
  process.exitCode = 1
})
