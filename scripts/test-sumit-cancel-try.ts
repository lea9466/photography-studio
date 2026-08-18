import { SumitClient } from '../lib/payments/providers/sumit/sumit-client'

async function run() {
  const client = new SumitClient()
  const customerId = Number(process.argv[2])
  const itemId = Number(process.argv[3])

  const attempts: Array<[string, Record<string, unknown>]> = [
    ['ID + Customer', { Customer: { ID: customerId }, ID: itemId }],
    ['RecurringID + Customer', { Customer: { ID: customerId }, RecurringID: itemId }],
    ['RecurringCustomerItemID + Customer', { Customer: { ID: customerId }, RecurringCustomerItemID: itemId }],
  ]

  for (const [label, body] of attempts) {
    try {
      const response = await client.postJson<Record<string, unknown>>(
        '/billing/recurring/cancel/',
        body
      )
      console.log(`[cancel-try] ${label} ->`, JSON.stringify(response))
    } catch (error) {
      console.log(
        `[cancel-try] ${label} -> ERROR`,
        error instanceof Error ? String(error.cause ?? error.message) : String(error)
      )
    }
  }
}

void run()
