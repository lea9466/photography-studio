import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createAdminClient } from '../lib/supabase/admin'

const GALLERY_ID = process.argv[2] || '7c727a89-1d61-4546-b75c-3757dee1e831'

async function run() {
  const db = createAdminClient()

  const { data: gallery, error: galleryErr } = await db
    .from('galleries')
    .select('*')
    .eq('id', GALLERY_ID)
    .maybeSingle()
  console.log('gallery:', JSON.stringify(gallery, null, 2))
  if (galleryErr) console.log('galleryErr:', galleryErr)

  const { data: photos, error } = await db
    .from('photos')
    .select('*')
    .eq('gallery_id', GALLERY_ID)
    .order('sort_order', { ascending: true })

  if (error) {
    console.log('error:', error)
    return
  }

  console.log('total photos:', photos?.length)
  for (const p of photos ?? []) {
    console.log(JSON.stringify(p))
  }
}

void run()
