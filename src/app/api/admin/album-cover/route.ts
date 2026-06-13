import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
} from '@/lib/api-auth-helpers'
import { adminUpdateAlbumCover } from '@/lib/admin-db'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

function revalidateAdmin() {
  revalidatePath('/admin')
  revalidatePath('/', 'layout')
  revalidatePath('/')
  revalidatePath('/gallery')
  revalidatePath('/contact')
}

type AlbumCoverBody = {
  albumId?: string
  coverUrl?: string
}

export async function POST(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json(
      { ok: false, message: adminConfigError() },
      { status: 503 }
    )
  }

  let body: AlbumCoverBody
  try {
    body = (await request.json()) as AlbumCoverBody
  } catch {
    return NextResponse.json(
      { ok: false, message: 'גוף הבקשה אינו JSON תקין' },
      { status: 400 }
    )
  }

  const albumId = String(body.albumId ?? '').trim()
  const coverUrl = String(body.coverUrl ?? '').trim()
  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר מזהה גלריה' },
      { status: 400 }
    )
  }
  if (!coverUrl) {
    return NextResponse.json(
      { ok: false, message: 'חסר קישור לתמונת שער' },
      { status: 400 }
    )
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const { error } = await adminUpdateAlbumCover(albumId, coverUrl)
  if (error) {
    return NextResponse.json({ ok: false, message: error }, { status: 500 })
  }

  revalidateAdmin()
  return NextResponse.json({
    ok: true,
    message: 'תמונת השער נשמרה',
  })
}
