import { SumitClient } from '../lib/payments/providers/sumit/sumit-client'

const CANDIDATES = [
  '/billing/recurring/cancel/',
  '/billing/recurring/remove/',
  '/billing/recurring/delete/',
  '/billing/recurring/update/',
  '/billing/recurring/stop/',
  '/billing/recurring/pause/',
]

async function run() {
  const client = new SumitClient()
  const itemId = Number(process.argv[2])

  for (const path of CANDIDATES) {
    try {
      const response = await client.postJson<Record<string, unknown>>(path, {
        ID: itemId,
        Status: 2,
      })
      console.log(`[probe] ${path} ->`, JSON.stringify(response))
    } catch (error) {
      console.log(
        `[probe] ${path} -> ERROR`,
        error instanceof Error ? error.message : String(error),
        (error as { detail?: string })?.detail ?? ''
      )
    }
  }
}

void run()
