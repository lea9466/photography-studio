'use server'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { resolveGalleryTableThumbnails } from '@/lib/actions/gallery.actions'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { getPublicSitePath } from '@/lib/queries/public-photographer'
type GalleryRow = GalleryWithDetails & {
  photos?: Array<{ count: number }>
}
export async function fetchDashboardGalleries(): Promise<GalleryWithDetails[]> {
  const context = await requireDashboardContext()
  const { data: galleries, error } = await context.supabase
    .from('galleries')
    .select(`
      *,
      client:clients(name),
      photos(count)
    `)
    .eq('user_id', context.userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const transformedGalleries = (galleries || []).map((gallery: GalleryRow) => {
    return {
      ...gallery,
      client: gallery.client,
      photo_count: gallery.photos?.[0]?.count || 0,
    }
  })
  try {
    const thumbnails = await resolveGalleryTableThumbnails(
      transformedGalleries.map((gallery) => ({
        id: gallery.id,
        cover_image: gallery.cover_image ?? null,
      }))
    )

    return transformedGalleries.map((gallery) => ({
      ...gallery,
      thumbnail_url: thumbnails[gallery.id] ?? null,
    }))
  } catch (error) {
    console.warn('Failed to resolve gallery thumbnails:', error)
    return transformedGalleries
  }
}

export async function fetchDashboardOverview() {
  const { userId, supabase } = await requireDashboardContext()

  const [{ data: userData }, { data: galleries, error }] = await Promise.all([
    supabase.from('users').select('name, slug, studio_name').eq('id', userId).single(),
    supabase
      .from('galleries')
      .select(`
        *,
        client:clients(name),
        photos(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (error) {
    throw new Error(error.message)
  }

  const typedUser = userData as { name: string | null; slug: string | null; studio_name: string | null } | null
  const studioPath = getPublicSitePath(typedUser?.slug, typedUser?.studio_name)

  const transformedGalleries = (galleries || []).map((gallery: GalleryRow) => ({
    ...gallery,
    client: gallery.client,
    photo_count: gallery.photos?.[0]?.count || 0,
  }))

  try {
    const thumbnails = await resolveGalleryTableThumbnails(
      transformedGalleries.map((gallery) => ({
        id: gallery.id,
        cover_image: gallery.cover_image ?? null,
      }))
    )

    return {
      userName: typedUser?.name || 'משתמש',
      studioPath,
      galleries: transformedGalleries.map((gallery) => ({
        ...gallery,
        thumbnail_url: thumbnails[gallery.id] ?? null,
      })),
    }
  } catch (error) {
    console.warn('Failed to resolve gallery thumbnails:', error)
    return {
      userName: typedUser?.name || 'משתמש',
      studioPath,
      galleries: transformedGalleries,
    }
  }
}

/** This studio's public site path (e.g. "/studio-name"), for building
 * public gallery share links from dashboard pages that don't otherwise
 * fetch the studio's own row — see RecentGalleriesTable.tsx's studioPath
 * prop. */
export async function fetchStudioPublicPath() {
  const { userId, supabase } = await requireDashboardContext()
  const { data } = await supabase
    .from('users')
    .select('slug, studio_name')
    .eq('id', userId)
    .single()

  const typedUser = data as { slug: string | null; studio_name: string | null } | null
  return getPublicSitePath(typedUser?.slug, typedUser?.studio_name)
}

export async function fetchUserEntitlements() {
  const { userId } = await requireDashboardContext()
  const entitlements = await getStudioEntitlements(userId)
  return {
    isPro: entitlements.isPro,
    tier: entitlements.tier,
    source: entitlements.source,
    limits: entitlements.limits,
  }
}
