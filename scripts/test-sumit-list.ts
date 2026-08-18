import { SumitClient } from '../lib/payments/providers/sumit/sumit-client'

async function run() {
  const client = new SumitClient()
  const customerId = Number(process.argv[2])

  const response = await client.postJson('/billing/recurring/listforcustomer/', {
    Customer: { ID: customerId },
    IncludeInactive: 'true',
  })
  console.log(JSON.stringify(response, null, 2))
}

void run().catch((error) => {
  console.error('[sumit-list] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
  })
  process.exitCode = 1
})
