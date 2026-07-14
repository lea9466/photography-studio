'use server'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createPresignedUploadUrl } from '@/lib/r2/storage'
import type { MediaBucket, R2UploadRequest } from '@/lib/r2/types'
import { validateGalleryPhotoUpload } from '@/lib/media-upload-limits'
import {
  assertGalleryPhotoCountWithinLimit,
  assertReservedPhotosExist,
  parsePhotoIdsFromUploadRequests,
} from '@/lib/gallery-photo-limits'
import {
  assertPostPhotoCountWithinLimit,
  assertReservedPostPhotosExist,
  parsePostPhotoIdsFromUploadRequests,
} from '@/lib/post-photo-limits'
import { assertPostOwner } from '@/lib/auth/post-owner'

// Buckets this action is actually ever asked to generate upload URLs for in
// the real client code (grep-verified: media-upload-pipeline.ts uses
// originals/previews/watermarked for both galleries and posts;
// components/gallery/UploadEdited.tsx additionally uses 'edited' for
// galleries only). Without this check, `bucket` was only constrained by the
// TypeScript MediaBucket type — which is compile-time only and does not
// stop a caller that bypasses the client (e.g. calling the server action
// directly with a crafted body) from requesting a presigned PUT URL into
// 'zips' (server-generated download archives only) or 'branding' (a
// completely separate upload flow), reusing a path prefix that otherwise
// passes the gallery/post ownership check.
const GALLERY_UPLOAD_BUCKETS = new Set<MediaBucket>(['originals', 'previews', 'watermarked', 'edited'])
const POST_UPLOAD_BUCKETS = new Set<MediaBucket>(['originals', 'previews', 'watermarked'])

function assertUploadItemsValid(items: R2UploadRequest[], allowedBuckets: Set<MediaBucket>) {
  for (const item of items) {
    if (!allowedBuckets.has(item.bucket)) {
      throw new Error('יעד העלאה לא תקין')
    }
    validateGalleryPhotoUpload(item.contentType, item.fileSize)
  }
}

async function assertGalleryUploadPaths(
  galleryId: string,
  items: R2UploadRequest[]
) {
  const { userId, supabase } = await requireDashboardContext()

  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, is_public')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .single()

  if (!gallery) throw new Error('גלריה לא נמצאה')

  const prefix = `${userId}/${galleryId}/`
  for (const item of items) {
    if (!item.path.startsWith(prefix)) {
      throw new Error('נתיב קובץ לא תקין')
    }
  }

  const photoIds = parsePhotoIdsFromUploadRequests(userId, galleryId, items)
  await assertReservedPhotosExist(supabase, galleryId, photoIds)
  await assertGalleryPhotoCountWithinLimit(
    supabase,
    galleryId,
    (gallery as { is_public: boolean }).is_public,
    0
  )

  return { id: userId }
}

export async function createR2UploadUrls(
  galleryId: string,
  items: R2UploadRequest[]
) {
  console.log('👉 10. createR2UploadUrls START', { galleryId, itemCount: items.length })
  assertUploadItemsValid(items, GALLERY_UPLOAD_BUCKETS)
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

async function assertPostUploadPaths(postId: string, items: R2UploadRequest[]) {
  const { user, supabase } = await assertPostOwner(postId)

  const prefix = `${user.id}/posts/${postId}/`
  for (const item of items) {
    if (!item.path.startsWith(prefix)) {
      throw new Error('נתיב קובץ לא תקין')
    }
  }

  const photoIds = parsePostPhotoIdsFromUploadRequests(user.id, postId, items)
  await assertReservedPostPhotosExist(supabase, postId, photoIds)
  await assertPostPhotoCountWithinLimit(supabase, postId, 0)

  return user
}

export async function createPostR2UploadUrls(
  postId: string,
  items: R2UploadRequest[]
) {
  assertUploadItemsValid(items, POST_UPLOAD_BUCKETS)
  await assertPostUploadPaths(postId, items)

  const urls = await Promise.all(
    items.map((item) =>
      createPresignedUploadUrl(item.bucket, item.path, item.contentType)
    )
  )
  return urls
}
