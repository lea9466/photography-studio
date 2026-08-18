import { SumitClient } from '../lib/payments/providers/sumit/sumit-client'

async function run() {
  const client = new SumitClient()
  const customerId = Number(process.argv[2])
  const response = await client.postJson('/billing/paymentmethods/getforcustomer/', {
    Customer: { ID: customerId },
  })
  console.log(JSON.stringify(response, null, 2))
}

void run().catch((error) => console.error(error))
