import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isR2Configured } from '@/lib/r2/config'
import { resolveMediaUrl, uploadMediaObject } from '@/lib/r2/storage'
import { validatePrimaryImageFile } from '@/lib/media-upload-limits'
import {
  buildCoverStoragePaths,
  processCoverCardImage,
  processCoverFullImage,
} from '@/lib/images/cover-process'
import { resolveWatermarkText } from '@/lib/images/process'

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
    const watermarkTextInput = formData.get('watermarkText')
    const applyAutoWatermarkInput = formData.get('applyAutoWatermark')

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

    const { data: profile } = await supabase
      .from('users')
      .select('studio_name')
      .eq('id', user.id)
      .single()

    const watermarkText = resolveWatermarkText(
      typeof watermarkTextInput === 'string' ? watermarkTextInput : null,
      (profile as { studio_name: string | null } | null)?.studio_name ?? null
    )
    const applyAutoWatermark = applyAutoWatermarkInput !== 'false'

    const bytes = await file.arrayBuffer()
    const inputBuffer = toBuffer(bytes)

    let fullBuffer: Buffer
    let cardBuffer: Buffer
    try {
      ;[fullBuffer, cardBuffer] = await Promise.all([
        processCoverFullImage(inputBuffer),
        processCoverCardImage(inputBuffer, { watermarkText, applyAutoWatermark }),
      ])
    } catch (processError) {
      console.error('Cover image processing failed:', processError)
      return NextResponse.json({ error: 'עיבוד התמונה נכשל' }, { status: 400 })
    }

    const { fullPath, cardPath } = buildCoverStoragePaths(user.id, Date.now())

    await Promise.all([
      uploadMediaObject('branding', fullPath, toUploadBody(fullBuffer), 'image/webp'),
      uploadMediaObject('branding', cardPath, toUploadBody(cardBuffer), 'image/webp'),
    ])

    const url = await resolveMediaUrl('branding', fullPath)
    if (!url) {
      return NextResponse.json({ error: 'לא ניתן ליצור כתובת לתמונה' }, { status: 500 })
    }

    return NextResponse.json({ url, path: fullPath, cardPath })
  } catch (error) {
    console.error('Error uploading cover image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'העלאת תמונת השער נכשלה' },
      { status: 500 }
    )
  }
}
