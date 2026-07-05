import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isR2Configured } from '@/lib/r2/config'
import { resolveMediaUrl, uploadMediaObject } from '@/lib/r2/storage'
import { validatePrimaryImageFile } from '@/lib/media-upload-limits'

export async function POST(request: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: 'אחסון תמונות לא מוגדר' }, { status: 503 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'יש להתחבר מחדש' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 })
    }

    try {
      validatePrimaryImageFile(file.type, file.size)
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : 'קובץ לא תקין' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const extension =
      file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
    const path = `${user.id}/gallery_cover_${Date.now()}.${extension}`

    await uploadMediaObject('branding', path, buffer, file.type)

    const url = await resolveMediaUrl('branding', path)
    if (!url) {
      return NextResponse.json({ error: 'לא ניתן ליצור כתובת לתמונה' }, { status: 500 })
    }

    return NextResponse.json({ url, path })
  } catch (error) {
    console.error('Error uploading cover image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'העלאת תמונת השער נכשלה' },
      { status: 500 }
    )
  }
}
