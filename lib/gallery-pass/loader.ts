import { createAdminClient } from '@/lib/supabase/admin'
import type { GalleryPassBundle } from './types'

/**
 * The live gallery-pass catalogue, ordered for display. Sourced straight from
 * the `gallery_pass_bundles` table that /manage edits — price, cap and validity
 * are never hardcoded, so a change takes effect without a deploy.
 */
export async function fetchActiveGalleryPassBundles(): Promise<GalleryPassBundle[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('gallery_pass_bundles')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as GalleryPassBundle[]
}

/** One active bundle by its stable `code` — the checkout flow's source of truth for price/cap/validity. */
export async function fetchGalleryPassBundleByCode(
  code: string
): Promise<GalleryPassBundle | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('gallery_pass_bundles')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()

  return (data as GalleryPassBundle | null) ?? null
}
