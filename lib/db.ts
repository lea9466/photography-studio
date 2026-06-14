import { createClient } from '@/lib/supabase/server'
import type { GalleryListItem, GalleryStatusFilter } from '@/lib/types/app.types'
import type { GalleryStatus } from '@/lib/types/database.types'

type GalleryRow = {
  id: string
  title: string
  status: GalleryStatus
  gallery_type: GalleryListItem['gallery_type']
  created_at: string
  clients: { name: string } | { name: string }[] | null
  photos: { count: number }[]
}

export async function fetchDashboardGalleries(
  statusFilter: GalleryStatusFilter = 'all'
): Promise<GalleryListItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('galleries')
    .select(
      `
      id,
      title,
      status,
      gallery_type,
      created_at,
      clients (name),
      photos (count)
    `
    )
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as GalleryRow[]).map((gallery) => {
    const client = Array.isArray(gallery.clients)
      ? gallery.clients[0]
      : gallery.clients

    return {
      id: gallery.id,
      title: gallery.title,
      status: gallery.status,
      gallery_type: gallery.gallery_type,
      created_at: gallery.created_at,
      client_name: client?.name ?? null,
      photo_count: gallery.photos[0]?.count ?? 0,
    }
  })
}
