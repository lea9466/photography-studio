import { createAdminClient } from '../lib/supabase/admin'

async function run() {
  const db = createAdminClient()
  const { data, error } = await db
    .from('subscriptions')
    .select('*')
    .eq('user_id', 'a1c962ae-79fd-4c45-853f-b0b5b2f2aa06')
    .eq('provider', 'sumit')
    .order('created_at', { ascending: false })
    .limit(3)
  console.log(JSON.stringify({ data, error }, null, 2))
}

void run()
