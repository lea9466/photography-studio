import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database.types'

export type GalleryPassCredit =
  Database['public']['Tables']['gallery_pass_credits']['Row']

/**
 * Every usable (paid, not yet consumed) gallery-pass credit the photographer is
 * holding, oldest first. She may hold several — of different sizes — bought for
 * different jobs, and she chooses which one a new gallery consumes.
 */
export async function fetchAvailableGalleryPassCredits(
  userId: string
): Promise<GalleryPassCredit[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('gallery_pass_credits')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .order('purchased_at', { ascending: true })

  return (data ?? []) as GalleryPassCredit[]
}

/**
 * The credit a gallery creation should consume:
 *   - `explicitId` given → that exact credit, if it's the user's and still paid
 *     (she picked it — used even when her tier wouldn't have blocked, e.g. a
 *     subscriber wanting one oversized gallery);
 *   - otherwise → her oldest available credit (the tier-blocked auto path).
 * Returns null when there's nothing usable.
 */
export async function resolveGalleryPassCreditForCreation(
  userId: string,
  explicitId?: string | null
): Promise<GalleryPassCredit | null> {
  const credits = await fetchAvailableGalleryPassCredits(userId)
  if (explicitId) {
    return credits.find((c) => c.id === explicitId) ?? null
  }
  return credits[0] ?? null
}

/**
 * Atomically attach a paid credit to a freshly-created gallery. Returns false
 * if the credit was already consumed by a concurrent creation — the caller must
 * then roll back the gallery it just made.
 */
export async function consumeGalleryPassCredit(
  creditId: string,
  galleryId: string
): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('gallery_pass_credits')
    .update({
      status: 'consumed',
      consumed_by_gallery_id: galleryId,
      consumed_at: new Date().toISOString(),
    } as never)
    .eq('id', creditId)
    .eq('status', 'paid')
    .select('id')

  return Array.isArray(data) && data.length > 0
}
