import { createAdminClient } from '../lib/supabase/admin'

async function run() {
  const db = createAdminClient()
  const { data, error } = await db
    .from('users')
    .select('id, email, trial_end_date')
    .eq('email', 'lea0556769466@gmail.com')
    .maybeSingle()
  console.log({ data, error })
}

void run()
