import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
} from '@/lib/api-auth-helpers'
import { adminUpdateAlbumCover } from '@/lib/admin-db'
import {
  coverStorageConfigError,
  coverStorageConfigured,
  uploadAlbumCover,
} from '@/lib/albums-storage'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

function revalidateAdmin() {
  revalidatePath('/admin')
  revalidatePath('/', 'layout')
  revalidatePath('/')
  revalidatePath('/gallery')
  revalidatePath('/contact')
}

export async function POST(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json(
      { ok: false, message: adminConfigError() },
      { status: 503 }
    )
  }
  if (!coverStorageConfigured()) {
    return NextResponse.json(
      { ok: false, message: coverStorageConfigError() },
      { status: 503 }
    )
  }

  const formData = await request.formData()
  const albumId = String(formData.get('album_id') ?? '').trim()
  const kind = String(formData.get('kind') ?? 'cover')

  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר מזהה גלריה' },
      { status: 400 }
    )
  }

  if (kind === 'gallery') {
    return NextResponse.json(
      {
        ok: false,
        message:
          'העלאת תמונות גלריה מתבצעת מהדפדפן ל-R2 — השתמשי בטופס ההעלאה בעריכת הגלריה',
      },
      { status: 400 }
    )
  }

  const coverFile = formData.get('cover_file')
  if (!(coverFile instanceof File) || coverFile.size === 0) {
    return NextResponse.json(
      { ok: false, message: 'לא נבחר קובץ להעלאה' },
      { status: 400 }
    )
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const { url, error: uploadError } = await uploadAlbumCover(albumId, coverFile)
  if (uploadError) {
    return NextResponse.json({ ok: false, message: uploadError }, { status: 500 })
  }
  if (url) {
    const { error: coverError } = await adminUpdateAlbumCover(albumId, url)
    if (coverError) {
      return NextResponse.json({ ok: false, message: coverError }, { status: 500 })
    }
  }

  revalidateAdmin()
  return NextResponse.json({
    ok: true,
    message: 'תמונת השער הועלתה ל-Cloudflare R2',
  })
}
