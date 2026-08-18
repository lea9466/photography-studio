import { SumitClient } from '../lib/payments/providers/sumit/sumit-client'

async function run() {
  const client = new SumitClient()
  const customerId = Number(process.argv[2])
  const token = process.argv[3]
  const expMonth = Number(process.argv[4])
  const expYear = Number(process.argv[5])

  console.log('[sumit-recurring-raw] charging with full PaymentMethod (incl. expiration)...')
  const response = await client.postJson('/billing/recurring/charge/', {
    Customer: { ID: customerId },
    PaymentMethod: {
      CreditCard_Token: token,
      CreditCard_ExpirationMonth: expMonth,
      CreditCard_ExpirationYear: expYear,
      Type: 1,
    },
    Items: [
      {
        Item: { Name: 'Studio Galleries — בדיקת חיוב חוזר', SearchMode: 'Automatic' },
        Quantity: 1,
        UnitPrice: 1,
        Currency: 'ILS',
      },
    ],
    VATIncluded: 'true',
    SendDocumentByEmail: 'false',
    DocumentDescription: 'בדיקת חיוב חוזר',
    DocumentLanguage: 'Hebrew',
  })
  console.log('[sumit-recurring-raw] raw response:')
  console.log(JSON.stringify(response, null, 2))
}

void run().catch((error) => {
  console.error('[sumit-recurring-raw] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    detail: (error as { detail?: string })?.detail,
  })
  process.exitCode = 1
})
