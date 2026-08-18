import { createAdminClient } from '../lib/supabase/admin'

async function run() {
  const db = createAdminClient()
  const { error } = await db
    .from('subscriptions')
    .delete()
    .eq('id', '0f44bd34-a463-486f-8eef-abb3f2ebce2b')
    .eq('status', 'pending')
  console.log({ error })
}

void run()
