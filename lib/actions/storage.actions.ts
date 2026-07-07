'use server'

import { createClient } from '@/lib/supabase/server'
import { createPresignedUploadUrl } from '@/lib/r2/storage'
import type { R2UploadRequest } from '@/lib/r2/types'
import {
  assertGalleryPhotoCountWithinLimit,
  assertReservedPhotosExist,
  parsePhotoIdsFromUploadRequests,
} from '@/lib/gallery-photo-limits'

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
    .select('id, is_public')
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

  const photoIds = parsePhotoIdsFromUploadRequests(user.id, galleryId, items)
  await assertReservedPhotosExist(supabase, galleryId, photoIds)
  await assertGalleryPhotoCountWithinLimit(
    supabase,
    galleryId,
    (gallery as { is_public: boolean }).is_public,
    0
  )

  return user
}

export async function createR2UploadUrls(
  galleryId: string,
  items: R2UploadRequest[]
) {
  console.log('👉 10. createR2UploadUrls START', { galleryId, itemCount: items.length })
  await assertGalleryUploadPaths(galleryId, items)
  console.log('👉 11. assertGalleryUploadPaths done')

  console.log('👉 12. About to create presigned URLs')
  const urls = await Promise.all(
    items.map((item) =>
      createPresignedUploadUrl(item.bucket, item.path, item.contentType)
    )
  )
  console.log('👉 13. Presigned URLs created', { urlCount: urls.length })
  return urls
}
