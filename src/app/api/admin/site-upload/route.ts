import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerSession,
} from '@/lib/api-auth-helpers'
import { adminUpdateHeroImage } from '@/lib/admin-db'
import {
  siteStorageConfigError,
  siteStorageConfigured,
  uploadSiteFile,
} from '@/lib/albums-storage'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json(
      { ok: false, message: adminConfigError() },
      { status: 503 }
    )
  }

  if (!siteStorageConfigured()) {
    return NextResponse.json(
      { ok: false, message: siteStorageConfigError() },
      { status: 503 }
    )
  }

  const auth = await requirePhotographerSession()
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const formData = await request.formData()
  const file = formData.get('hero_file')
  const targetRaw = String(formData.get('hero_target') ?? 'desktop').trim()
  const target = targetRaw === 'mobile' ? 'mobile' : 'desktop'

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { ok: false, message: 'לא נבחר קובץ להעלאה' },
      { status: 400 }
    )
  }

  const { url, error } = await uploadSiteFile(
    file,
    target === 'mobile' ? 'hero-mobile' : 'hero'
  )
  if (error) {
    return NextResponse.json({ ok: false, message: error }, { status: 500 })
  }
  if (!url) {
    return NextResponse.json(
      { ok: false, message: 'שגיאה בהעלאת התמונה' },
      { status: 500 }
    )
  }

  const { error: updateError } = await adminUpdateHeroImage(url, target)
  if (updateError) {
    return NextResponse.json(
      { ok: false, message: updateError },
      { status: 500 }
    )
  }

  revalidatePath('/admin')
  revalidatePath('/', 'layout')
  revalidatePath('/')

  return NextResponse.json({
    ok: true,
    message:
      target === 'mobile'
        ? 'תמונת ה-Hero למובייל הועלתה ל-Supabase ונשמרה'
        : 'תמונת ה-Hero לדסקטופ הועלתה ל-Supabase ונשמרה',
    url,
  })
}
