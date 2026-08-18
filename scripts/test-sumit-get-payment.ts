import { SumitClient } from '../lib/payments/providers/sumit/sumit-client'

async function run() {
  const client = new SumitClient()
  const paymentId = Number(process.argv[2])
  if (!Number.isFinite(paymentId)) {
    throw new Error('Usage: tsx scripts/test-sumit-get-payment.ts <PaymentID>')
  }

  console.log('[sumit-get-payment] fetching payment', paymentId)
  const response = await client.postJson('/billing/payments/get/', { PaymentID: paymentId })
  console.log('[sumit-get-payment] raw response:')
  console.log(JSON.stringify(response, null, 2))
}

void run().catch((error) => {
  console.error('[sumit-get-payment] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    detail: (error as { detail?: string })?.detail,
  })
  process.exitCode = 1
})
