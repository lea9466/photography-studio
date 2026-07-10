'use server'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { resolveGalleryTableThumbnails } from '@/lib/actions/gallery.actions'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'
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
    supabase.from('users').select('name').eq('id', userId).single(),
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
      userName: (userData as { name: string | null } | null)?.name || 'משתמש',
      galleries: transformedGalleries.map((gallery) => ({
        ...gallery,
        thumbnail_url: thumbnails[gallery.id] ?? null,
      })),
    }
  } catch (error) {
    console.warn('Failed to resolve gallery thumbnails:', error)
    return {
      userName: (userData as { name: string | null } | null)?.name || 'משתמש',
      galleries: transformedGalleries,
    }
  }
}
