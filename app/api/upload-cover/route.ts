import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isR2Configured } from '@/lib/r2/config'
import { resolveMediaUrl, uploadMediaObject } from '@/lib/r2/storage'
import { validatePrimaryImageFile } from '@/lib/media-upload-limits'
import { buildCoverStoragePath } from '@/lib/images/cover-process'

function toBuffer(data: ArrayBuffer | SharedArrayBuffer): Buffer {
  return Buffer.from(new Uint8Array(data))
}

function toUploadBody(buffer: Buffer): Uint8Array {
  return Uint8Array.from(buffer)
}

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
    const inputBuffer = toBuffer(bytes)
    const path = buildCoverStoragePath(user.id, Date.now(), file.type)

    await uploadMediaObject('branding', path, toUploadBody(inputBuffer), file.type)

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
