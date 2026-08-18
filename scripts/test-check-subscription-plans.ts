import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createAdminClient } from '../lib/supabase/admin'

async function run() {
  const db = createAdminClient()
  const { data, error } = await db
    .from('subscription_plans')
    .select('*')
    .order('amount_agorot', { ascending: true })
  console.log(JSON.stringify(data, null, 2))
  if (error) console.log(error)
}

void run()
