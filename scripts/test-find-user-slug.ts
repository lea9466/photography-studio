import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createAdminClient } from '../lib/supabase/admin'

const USER_ID = process.argv[2] || '07eca7c9-fef8-4177-9797-12aff12ae93e'

async function run() {
  const db = createAdminClient()
  const { data, error } = await db
    .from('users')
    .select('*')
    .eq('id', USER_ID)
    .maybeSingle()
  console.log(JSON.stringify(data, null, 2))
  if (error) console.log(error)
}

void run()
