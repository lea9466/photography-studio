// Live smoke test for the one-time-payment flow (see docs/payments-architecture.md
// § "One-time payment (דיירקט cards)"). This calls createOneTimeCheckoutSession,
// which sends SUMIT's beginredirect with AuthoriseOnly:'false' — a real, final
// charge, never independently live-tested in this codebase before now. Uses a
// real דיירקט card here specifically, since a normal credit card can't prove
// anything about the issuer limitation this flow exists to work around.
//
// Requires a local dev server running on the SAME port as NEXT_PUBLIC_APP_URL
// below (`npm run dev -- -p 3001`), since SUMIT redirects the browser back to
// that server's /api/payments/webhooks/sumit/return route to complete the
// charge server-side. Running this script alone does not complete anything —
// it only creates the checkout session and prints the URL to open manually.
//
// Usage: npx tsx scripts/test-sumit-one-time-checkout.ts [userId] [months]
//   userId — defaults to the same smoke-test account used by
//            test-sumit-real-checkout.ts. Must be a real row in `users`
//            with an email (createOneTimeCheckout creates a SUMIT customer
//            from it).
//   months — how many months to charge at the studio_monthly rate
//            (1 = "monthly", 12 = "yearly", or any custom count). Defaults to 1.

process.env.PAYMENT_PROVIDER = 'sumit'
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

import { createPaymentService } from '../lib/payments/server'

async function run() {
  const userId = process.argv[2] ?? 'a1c962ae-79fd-4c45-853f-b0b5b2f2aa06'
  const months = process.argv[3] ? Number(process.argv[3]) : 1

  console.log('[one-time-checkout] creating one-time checkout session...', {
    userId,
    months,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  })

  const service = createPaymentService()
  const session = await service.createOneTimeCheckout({
    userId,
    months,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?checkout=success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?checkout=cancelled`,
  })

  console.log('[one-time-checkout] session:', session)
  console.log('')
  console.log('NEXT STEPS (manual):')
  console.log('1. Make sure a local dev server is running at', process.env.NEXT_PUBLIC_APP_URL)
  console.log('2. Open this URL in a browser and pay with a real דיירקט card:')
  console.log('  ', session.url)
  console.log('3. Watch the dev server logs for [payments][sumit-return] — it should')
  console.log('   redirect to .../dashboard/subscription?checkout=success with no error.')
  console.log('4. If it fails, look for "cannot run" / issuer decline details in the')
  console.log('   redirect (?checkout=error) and the server logs — that tells you')
  console.log('   whether AuthoriseOnly:\'false\' actually avoids the recurring-')
  console.log('   authorization request this flow exists to avoid.')
  console.log('5. Confirm in the DB: the subscription row for this user should have')
  console.log(`   status=active, payment_type=one_time, and a current_period_end`)
  console.log(`   about ${months} month(s) from now.`)
}

void run().catch((error) => {
  console.error('[one-time-checkout] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    detail: (error as { detail?: string })?.detail,
  })
  process.exitCode = 1
})
