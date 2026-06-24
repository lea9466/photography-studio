import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getR2Client } from '@/lib/r2/client'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getR2Config } from '@/lib/r2/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `cover-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`

    // Upload to R2
    const r2Client = getR2Client()
    const config = getR2Config()

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: `cover-images/${user.id}/${filename}`,
      Body: buffer,
      ContentType: file.type,
    })

    await r2Client.send(command)

    // Construct public URL
    const publicUrl = `${config.publicUrl}/cover-images/${user.id}/${filename}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Error uploading cover image:', error)
    return NextResponse.json(
      { error: 'Failed to upload cover image' },
      { status: 500 }
    )
  }
}
