import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createAdminClient } from '../lib/supabase/admin'

const USER_ID = process.argv[2] || '07eca7c9-fef8-4177-9797-12aff12ae93e'

async function run() {
  const db = createAdminClient()
  const { data: galleries, error } = await db
    .from('galleries')
    .select('id, title, gallery_type, status, is_public, cover_image, created_at')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  for (const g of galleries ?? []) {
    console.log(JSON.stringify(g))
  }
}

void run()
