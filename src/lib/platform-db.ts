import 'server-only'

import { getAdminClient } from '@/lib/supabase-admin'
import type { PhotographersRow } from '@/lib/database.types'

export type PlatformAlbumStats = {
  id: string
  title: string | null
  imageCount: number
  status: string | null
  isPublic: boolean | null
}

export type PlatformPhotographerStats = PhotographersRow & {
  albumCount: number
  imageCount: number
  clientCount: number
  albums: PlatformAlbumStats[]
}

export type PlatformOverview = {
  photographerCount: number
  totalAlbums: number
  totalImages: number
  photographers: PlatformPhotographerStats[]
}

export async function fetchPlatformOverview(): Promise<PlatformOverview> {
  const sb = getAdminClient()
  if (!sb) {
    return {
      photographerCount: 0,
      totalAlbums: 0,
      totalImages: 0,
      photographers: [],
    }
  }

  const { data: photographers, error: photographersError } = await sb
    .from('photographers')
    .select('*')
    .order('created_at', { ascending: true })

  if (photographersError) {
    console.error('platform photographers:', photographersError.message)
    return {
      photographerCount: 0,
      totalAlbums: 0,
      totalImages: 0,
      photographers: [],
    }
  }

  const rows = photographers ?? []
  if (rows.length === 0) {
    return {
      photographerCount: 0,
      totalAlbums: 0,
      totalImages: 0,
      photographers: [],
    }
  }

  const photographerIds = rows.map((p) => p.id)

  const [{ data: albums }, { data: clients }, { data: images }] =
    await Promise.all([
      sb
        .from('albums')
        .select('id, title, status, is_public, photographer_id')
        .in('photographer_id', photographerIds),
      sb
        .from('clients')
        .select('id, photographer_id')
        .in('photographer_id', photographerIds),
      sb.from('images').select('id, album_id'),
    ])

  const albumsByPhotographer = new Map<string, PlatformAlbumStats[]>()
  const albumToPhotographer = new Map<string, string>()
  const imageCountByAlbum = new Map<string, number>()

  for (const album of albums ?? []) {
    albumToPhotographer.set(album.id, album.photographer_id)
    const list = albumsByPhotographer.get(album.photographer_id) ?? []
    list.push({
      id: album.id,
      title: album.title,
      imageCount: 0,
      status: album.status,
      isPublic: album.is_public,
    })
    albumsByPhotographer.set(album.photographer_id, list)
  }

  for (const image of images ?? []) {
    imageCountByAlbum.set(
      image.album_id,
      (imageCountByAlbum.get(image.album_id) ?? 0) + 1
    )
  }

  let totalAlbums = 0
  let totalImages = 0

  const photographersStats: PlatformPhotographerStats[] = rows.map((p) => {
    const pAlbums = (albumsByPhotographer.get(p.id) ?? []).map((album) => {
      const count = imageCountByAlbum.get(album.id) ?? 0
      return { ...album, imageCount: count }
    })

    const albumCount = pAlbums.length
    const imageCount = pAlbums.reduce((sum, a) => sum + a.imageCount, 0)
    const clientCount = (clients ?? []).filter(
      (c) => c.photographer_id === p.id
    ).length

    totalAlbums += albumCount
    totalImages += imageCount

    return {
      ...p,
      albumCount,
      imageCount,
      clientCount,
      albums: pAlbums.sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? '', 'he')
      ),
    }
  })

  return {
    photographerCount: rows.length,
    totalAlbums,
    totalImages,
    photographers: photographersStats,
  }
}
