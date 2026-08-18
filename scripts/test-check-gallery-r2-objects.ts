import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createAdminClient } from '../lib/supabase/admin'
import { mediaObjectExists } from '../lib/r2/storage'

const GALLERY_ID = process.argv[2] || '7c727a89-1d61-4546-b75c-3757dee1e831'

async function run() {
  const db = createAdminClient()
  const { data: photos, error } = await db
    .from('photos')
    .select('id, preview_url, watermarked_preview_url, is_processed, is_visible_to_client')
    .eq('gallery_id', GALLERY_ID)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  for (const p of photos ?? []) {
    const previewExists = p.preview_url ? await mediaObjectExists('previews', p.preview_url) : null
    const wmExists = p.watermarked_preview_url
      ? await mediaObjectExists('watermarked', p.watermarked_preview_url)
      : null
    const flag = previewExists === false || wmExists === false ? '  <-- MISSING' : ''
    console.log(`${p.id}  preview=${previewExists}  wm=${wmExists}${flag}`)
  }
}

void run()
