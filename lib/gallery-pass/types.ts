import type { Database } from '@/lib/types/database.types'

/**
 * Pay-per-gallery "gallery pass": a one-time purchase that lets a photographer
 * WITHOUT an active private-gallery subscription create one client gallery, with
 * a bought photo cap and a time-limited client-access window. Fully independent
 * of the recurring private-gallery tiers (lib/private-galleries) — see the
 * migration 20260904000000_add_gallery_pass_bundles.sql.
 */
export type GalleryPassBundle =
  Database['public']['Tables']['gallery_pass_bundles']['Row']

/**
 * Above this photo count there's no bundle — the picker shows a "contact me"
 * link instead. Kept in code (not the bundle table) because it's UI copy, not a
 * priced product.
 */
export const GALLERY_PASS_CONTACT_THRESHOLD = 1500

/** The pass fields carried on a `galleries` row, once one has been bought. */
export type GalleryPassState = {
  bundleId: string | null
  photoCap: number | null
  validityDays: number | null
  purchasedAt: string | null
}

/** True once the pass has actually been paid for (not just selected). */
export function isGalleryPassPaid(state: Pick<GalleryPassState, 'bundleId' | 'purchasedAt'>): boolean {
  return state.bundleId != null && state.purchasedAt != null
}

/** True when a pass was selected for this gallery but payment never completed. */
export function isGalleryPassUnpaid(state: Pick<GalleryPassState, 'bundleId' | 'purchasedAt'>): boolean {
  return state.bundleId != null && state.purchasedAt == null
}
