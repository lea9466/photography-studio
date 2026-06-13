import 'server-only'

import {
  adminBulkDeleteImagesByIds,
  adminDeleteAlbum,
  adminDeleteAllAlbumImages,
} from '@/lib/admin-db'
import {
  adminResolvePhotographerId,
  resolvePhotographerIdForAlbum,
} from '@/lib/photographer-scope'

export type BulkDeleteMode = 'images' | 'all' | 'album'

type EdgeDeleteBody = {
  mode: BulkDeleteMode
  albumId: string
  imageIds?: string[]
  photographerId?: string
}

async function invokeBulkDeleteEdgeFunction(
  body: EdgeDeleteBody
): Promise<{ ok: boolean; error: string | null; unavailable: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    return { ok: false, error: null, unavailable: true }
  }

  try {
    const response = await fetch(`${url}/functions/v1/bulk-delete-images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    })

    if (response.status === 202) {
      return { ok: true, error: null, unavailable: false }
    }

    if (response.status === 404) {
      return { ok: false, error: null, unavailable: true }
    }

    const data = (await response.json().catch(() => ({}))) as {
      error?: string
    }
    return {
      ok: false,
      error: data.error ?? `שגיאה במחיקה (${response.status})`,
      unavailable: false,
    }
  } catch {
    return { ok: false, error: null, unavailable: true }
  }
}

async function inlineBulkDelete(params: {
  mode: BulkDeleteMode
  albumId: string
  imageIds?: string[]
}): Promise<{ error: string | null }> {
  if (params.mode === 'all') {
    const { error } = await adminDeleteAllAlbumImages(params.albumId)
    return { error }
  }

  if (params.mode === 'album') {
    const { error } = await adminDeleteAlbum(params.albumId)
    return { error }
  }

  const { error } = await adminBulkDeleteImagesByIds(
    params.albumId,
    params.imageIds ?? []
  )
  return { error }
}

export async function invokeBulkDeleteImages(params: {
  mode: BulkDeleteMode
  albumId: string
  imageIds?: string[]
}): Promise<{ error: string | null }> {
  const albumId = params.albumId.trim()
  if (!albumId) return { error: 'חסר מזהה גלריה' }

  if (params.mode === 'images') {
    const imageIds = [
      ...new Set((params.imageIds ?? []).map((id) => id.trim()).filter(Boolean)),
    ]
    if (imageIds.length === 0) return { error: 'לא נבחרו תמונות למחיקה' }
    if (imageIds.length > 10_000) {
      return { error: 'יותר מדי תמונות בבקשה אחת (מקסימום 10,000)' }
    }
  }

  const sessionPhotographerId = await adminResolvePhotographerId()
  const { photographerId: albumPhotographerId, error: scopeError } =
    await resolvePhotographerIdForAlbum(albumId)

  if (scopeError) return { error: scopeError }
  if (
    sessionPhotographerId &&
    albumPhotographerId &&
    sessionPhotographerId !== albumPhotographerId
  ) {
    return { error: 'אין הרשאה לגלריה זו' }
  }

  const photographerId =
    albumPhotographerId ?? sessionPhotographerId ?? undefined

  const edge = await invokeBulkDeleteEdgeFunction({
    mode: params.mode,
    albumId,
    imageIds: params.imageIds,
    photographerId,
  })

  if (edge.ok) return { error: null }
  if (edge.error) return { error: edge.error }

  if (edge.unavailable) {
    return inlineBulkDelete(params)
  }

  return { error: 'שגיאה במחיקה' }
}
