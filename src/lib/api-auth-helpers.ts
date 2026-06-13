import 'server-only'

import { NextResponse } from 'next/server'
import { getPhotographerSession } from '@/lib/auth-helpers'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

export type AdminAuthFailure = {
  ok: false
  status: number
  message: string
}

export type AdminAuthSuccess = {
  ok: true
  photographerId: string
}

export function adminAuthJsonResponse(failure: AdminAuthFailure): NextResponse {
  return NextResponse.json(
    { ok: false, message: failure.message },
    { status: failure.status }
  )
}

/** דורש סשן Supabase Auth + שורת photographer. */
export async function requirePhotographerSession(): Promise<
  AdminAuthFailure | AdminAuthSuccess
> {
  const session = await getPhotographerSession()
  if (!session) {
    return { ok: false, status: 401, message: 'יש להתחבר כצלם' }
  }

  return { ok: true, photographerId: session.photographer.id }
}

/** וידוא שהאלבום קיים ושייך לצלם המחובר. */
export async function requirePhotographerAlbumAccess(
  albumId: string
): Promise<AdminAuthFailure | AdminAuthSuccess> {
  const session = await requirePhotographerSession()
  if (!session.ok) return session

  const clean = albumId.trim()
  if (!clean) {
    return { ok: false, status: 400, message: 'חסר album_id' }
  }

  const sb = getAdminClient()
  if (!sb) {
    return { ok: false, status: 503, message: adminConfigError() }
  }

  const { data, error } = await sb
    .from('albums')
    .select('id, photographer_id')
    .eq('id', clean)
    .maybeSingle()

  if (error) {
    return { ok: false, status: 500, message: error.message }
  }
  if (!data) {
    return { ok: false, status: 404, message: 'גלריה לא נמצאה' }
  }
  if (data.photographer_id !== session.photographerId) {
    return { ok: false, status: 403, message: 'אין הרשאה לגלריה זו' }
  }

  return { ok: true, photographerId: session.photographerId }
}

/** כל מזהי התמונות חייבים להיות תחת album_id — מונע presign לנתיבים זרים. */
export async function verifyImageIdsBelongToAlbum(
  albumId: string,
  imageIds: string[]
): Promise<{ ok: true } | AdminAuthFailure> {
  const uniqueIds = [...new Set(imageIds.map((id) => id.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) {
    return { ok: false, status: 400, message: 'חסרים מזהי תמונות' }
  }
  if (uniqueIds.length !== imageIds.length) {
    return { ok: false, status: 400, message: 'מזהי תמונות כפולים או ריקים' }
  }

  const sb = getAdminClient()
  if (!sb) {
    return { ok: false, status: 503, message: adminConfigError() }
  }

  const { data, error } = await sb
    .from('images')
    .select('id')
    .eq('album_id', albumId.trim())
    .in('id', uniqueIds)

  if (error) {
    return { ok: false, status: 500, message: error.message }
  }
  if ((data?.length ?? 0) !== uniqueIds.length) {
    return {
      ok: false,
      status: 403,
      message: 'אחד או יותר ממזהי התמונות אינם שייכים לגלריה',
    }
  }

  return { ok: true }
}

const OWNERSHIP_VERIFY_BATCH = 80

/** cleanup — וידוא שכל השורות שייכות לצלם המחובר. */
export async function verifyImageIdsOwnedByPhotographer(
  photographerId: string,
  imageIds: string[]
): Promise<{ ok: true } | AdminAuthFailure> {
  const uniqueIds = [...new Set(imageIds.map((id) => id.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) {
    return { ok: true }
  }

  const sb = getAdminClient()
  if (!sb) {
    return { ok: false, status: 503, message: adminConfigError() }
  }

  const rows: Array<{ id: string; album_id: string }> = []

  for (let i = 0; i < uniqueIds.length; i += OWNERSHIP_VERIFY_BATCH) {
    const batch = uniqueIds.slice(i, i + OWNERSHIP_VERIFY_BATCH)
    const { data, error } = await sb
      .from('images')
      .select('id, album_id')
      .in('id', batch)

    if (error) {
      return { ok: false, status: 500, message: error.message }
    }

    if (data?.length) rows.push(...data)
  }

  if (rows.length !== uniqueIds.length) {
    return {
      ok: false,
      status: 403,
      message: 'אחד או יותר ממזהי התמונות לא נמצאו',
    }
  }

  const albumIds = [...new Set(rows.map((row) => row.album_id))]
  const { data: albums, error: albumsError } = await sb
    .from('albums')
    .select('id, photographer_id')
    .in('id', albumIds)

  if (albumsError) {
    return { ok: false, status: 500, message: albumsError.message }
  }

  const albumOwner = new Map(
    (albums ?? []).map((album) => [album.id, album.photographer_id])
  )

  const allOwned = rows.every(
    (row) => albumOwner.get(row.album_id) === photographerId
  )
  if (!allOwned) {
    return { ok: false, status: 403, message: 'אין הרשאה למחוק תמונות אלו' }
  }

  return { ok: true }
}
