import { createAdminClient } from '../lib/supabase/admin'

async function run() {
  const db = createAdminClient()
  const { data, error } = await db
    .from('subscriptions')
    .select('id, user_id, status, provider, created_at, current_period_end')
    .eq('provider', 'payme')
    .order('created_at', { ascending: false })
  console.log(JSON.stringify({ count: data?.length ?? 0, data, error }, null, 2))
}

void run()
