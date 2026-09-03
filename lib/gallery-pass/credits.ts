import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database.types'

export type GalleryPassCredit =
  Database['public']['Tables']['gallery_pass_credits']['Row']

/**
 * The photographer's oldest usable (paid, not yet consumed) gallery-pass
 * credit, or null. This is what lets a tier-blocked client-gallery creation go
 * through without a payment step.
 */
export async function fetchAvailableGalleryPassCredit(
  userId: string
): Promise<GalleryPassCredit | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('gallery_pass_credits')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .order('purchased_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return (data as GalleryPassCredit | null) ?? null
}

/** How many usable credits the photographer is holding — for dashboard copy. */
export async function countAvailableGalleryPassCredits(
  userId: string
): Promise<number> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('gallery_pass_credits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'paid')

  return count ?? 0
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
