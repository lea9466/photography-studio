import { createAdminClient } from '../lib/supabase/admin'

async function run() {
  const db = createAdminClient()
  const now = new Date()

  const { data: expired, error: expiredError } = await db
    .from('users')
    .select('id, email, trial_end_date')
    .is('trial_expired_email_sent_at', null)
    .not('email', 'is', null)
    .neq('email', '')
    .lt('trial_end_date', now.toISOString())

  console.log('[trial-expired candidates]', { count: expired?.length ?? 0, error: expiredError })
  console.log(expired)

  const dayMs = 24 * 60 * 60 * 1000
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const windowEnd = new Date(startOfToday.getTime() + 4 * dayMs)

  const { data: ending, error: endingError } = await db
    .from('users')
    .select('id, email, trial_end_date')
    .is('trial_ending_email_sent_at', null)
    .not('email', 'is', null)
    .neq('email', '')
    .gte('trial_end_date', now.toISOString())
    .lt('trial_end_date', windowEnd.toISOString())

  console.log('[trial-ending-soon candidates]', { count: ending?.length ?? 0, error: endingError })
  console.log(ending)
}

void run()
