import { createAdminClient } from '../lib/supabase/admin'

async function run() {
  const db = createAdminClient()
  const { data, error } = await db.rpc('exec_sql' as never, {
    sql: `select conname, conrelid::regclass as table_name, pg_get_constraintdef(oid) as def
          from pg_constraint
          where conname like '%provider_check%'
          order by conrelid::regclass::text;`,
  } as never)
  if (error) {
    console.log('rpc not available, trying direct query fallback', error)
    return
  }
  console.log(JSON.stringify(data, null, 2))
}

void run()
