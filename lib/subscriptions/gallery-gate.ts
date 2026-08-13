import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/server'
import { ProFeatureBlockedError } from './guard'

type DashboardSupabaseClient = Awaited<ReturnType<typeof createClient>>
type AppSupabase = Pick<DashboardSupabaseClient, 'from'>

export async function countPublicGalleries(
  supabase: AppSupabase,
  userId: string,
  excludeGalleryId?: string
): Promise<number> {
  let query = supabase
    .from('galleries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', true)
  if (excludeGalleryId) {
    query = query.neq('id', excludeGalleryId)
  }
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * FREE tier gate for marking a gallery as publicly displayed.
 *
 * FREE users may create/edit/upload to unlimited galleries, but only ONE
 * gallery may be `is_public` (displayed on the public site) at a time. When a
 * second gallery is marked public we throw a PRO gate error and the currently
 * displayed gallery stays untouched.
 */
export async function assertFreeGalleryCanBecomePublic(
  supabase: AppSupabase,
  userId: string,
  targetGalleryId: string
): Promise<void> {
  const otherPublicCount = await countPublicGalleries(
    supabase,
    userId,
    targetGalleryId
  )
  if (otherPublicCount > 0) {
    throw new ProFeatureBlockedError('multiple_public_galleries')
  }
}
