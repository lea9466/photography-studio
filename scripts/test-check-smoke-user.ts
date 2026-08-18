import { createAdminClient } from '../lib/supabase/admin'

async function run() {
  const userId = process.env.PAYMENTS_SMOKE_TEST_USER_ID
  const db = createAdminClient()
  const { data, error } = await db.from('users').select('id, email').eq('id', userId).maybeSingle()
  console.log({ userId, data, error })
}

void run()
