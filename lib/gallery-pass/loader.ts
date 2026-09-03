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

/**
 * One bundle by id, INCLUDING inactive ones — the payment return handler needs
 * to honor a purchase even if the bundle was deactivated between gallery
 * creation and the customer completing checkout.
 */
export async function fetchGalleryPassBundleById(
  id: string
): Promise<GalleryPassBundle | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('gallery_pass_bundles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return (data as GalleryPassBundle | null) ?? null
}

/** Every bundle including inactive ones — for the /manage editor. */
export async function fetchAllGalleryPassBundles(): Promise<GalleryPassBundle[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('gallery_pass_bundles')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as GalleryPassBundle[]
}
