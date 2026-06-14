'use server'

import { createClient } from '@/lib/supabase/server'
import { createPresignedUploadUrl } from '@/lib/r2/storage'
import type { R2UploadRequest } from '@/lib/r2/types'

async function assertGalleryUploadPaths(
  galleryId: string,
  items: R2UploadRequest[]
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const { data: gallery } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .eq('user_id', user.id)
    .single()

  if (!gallery) throw new Error('גלריה לא נמצאה')

  const prefix = `${user.id}/${galleryId}/`
  for (const item of items) {
    if (!item.path.startsWith(prefix)) {
      throw new Error('נתיב קובץ לא תקין')
    }
  }

  return user
}

export async function createR2UploadUrls(
  galleryId: string,
  items: R2UploadRequest[]
) {
  await assertGalleryUploadPaths(galleryId, items)

  return Promise.all(
    items.map((item) =>
      createPresignedUploadUrl(item.bucket, item.path, item.contentType)
    )
  )
}
