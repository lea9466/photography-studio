import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createAdminClient } from '../lib/supabase/admin'

const NAME_FRAGMENT = process.argv[2] || 'לתפוס רגעים יפים'

async function run() {
  const db = createAdminClient()
  const { data, error } = await db
    .from('users')
    .select('id, slug, studio_name, name, logo_url, should_color_logo')
    .or(`studio_name.ilike.%${NAME_FRAGMENT}%,name.ilike.%${NAME_FRAGMENT}%`)
  console.log(JSON.stringify(data, null, 2))
  if (error) console.log(error)
}

void run()
