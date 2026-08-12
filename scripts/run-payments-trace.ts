import { createPaymentService } from '../lib/payments/server'

async function run() {
  try {
    // Use the smoke-test user from .env.local for a controlled run
    const userId = process.env.PAYMENTS_SMOKE_TEST_USER_ID || 'user-1'
    const service = createPaymentService()
    console.log('[payments-trace] starting createCheckout for user', userId)
    const session = await service.createCheckout({
      userId,
      planCode: 'studio_monthly',
      successUrl: 'https://studio-galleries.com/dashboard/subscription?checkout=success',
      cancelUrl: 'https://studio-galleries.com/dashboard/subscription?checkout=cancelled',
    })
    console.log('[payments-trace] createCheckout returned (unexpected):', session)
  } catch (err) {
    console.error('[payments-trace] run error', {
      name: err instanceof Error ? err.name : 'Error',
      message: err instanceof Error ? err.message : String(err),
    })
    // Re-throw to let process exit non-zero when appropriate
    throw err
  }
}

void run()
