import { createAdminClient } from '@/lib/supabase/admin'
import { isR2Configured } from '@/lib/r2/config'
import {
  deleteMediaObjects,
  deleteMediaPrefix,
  deleteR2ObjectKey,
} from '@/lib/r2/storage'
import type { MediaBucket } from '@/lib/r2/types'
import { parseTestimonialImageRef } from '@/lib/testimonial-image-url'

const MEDIA_BUCKETS: MediaBucket[] = [
  'originals',
  'previews',
  'watermarked',
  'edited',
  'zips',
  'branding',
]

const DELETE_BATCH_SIZE = 50

type UserProfileRow = {
  id: string
  slug: string | null
  studio_name: string | null
  logo_url: string | null
  hero_desktop_url: string | null
  hero_mobile_url: string | null
  hero_desktop_urls: string[] | null
  hero_mobile_urls: string[] | null
  about_image_url: string | null
  contact_desktop_url: string | null
  contact_mobile_url: string | null
  packages_desktop_url: string | null
  packages_mobile_url: string | null
}

function collectBrandingPaths(profile: UserProfileRow) {
  const paths: { bucket: MediaBucket; path: string }[] = []
  const values = [
    profile.logo_url,
    profile.hero_desktop_url,
    profile.hero_mobile_url,
    profile.about_image_url,
    profile.contact_desktop_url,
    profile.contact_mobile_url,
    profile.packages_desktop_url,
    profile.packages_mobile_url,
    ...(profile.hero_desktop_urls ?? []),
    ...(profile.hero_mobile_urls ?? []),
  ]

  for (const value of values) {
    const path = value?.trim()
    if (!path || path.startsWith('http://') || path.startsWith('https://')) continue
    paths.push({
      bucket: 'branding',
      path: path.replace(/^branding\//, ''),
    })
  }

  return paths
}

async function collectGalleryMediaPaths(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const storageDeletes: { bucket: MediaBucket; path: string }[] = []
  const rawKeys: string[] = []

  const { data: galleries, error: galleriesError } = await admin
    .from('galleries')
    .select('id, cover_image')
    .eq('user_id', userId)

  if (galleriesError) throw new Error(galleriesError.message)

  const galleryIds = (galleries ?? []).map((gallery) => gallery.id)

  for (const gallery of galleries ?? []) {
    const cover = (gallery as { cover_image: string | null }).cover_image?.trim()
    if (!cover || cover.startsWith('http://') || cover.startsWith('https://')) continue

    if (cover.startsWith('cover-images/')) {
      rawKeys.push(cover)
      continue
    }

    storageDeletes.push({
      bucket: 'branding',
      path: cover.replace(/^branding\//, ''),
    })
  }

  if (galleryIds.length === 0) {
    return { storageDeletes, rawKeys }
  }

  const [photosResult, editedResult, jobsResult] = await Promise.all([
    admin
      .from('photos')
      .select('original_url, preview_url, watermarked_preview_url, gallery_id')
      .in('gallery_id', galleryIds),
    admin.from('edited_photos').select('final_url, gallery_id').in('gallery_id', galleryIds),
    admin.from('download_jobs').select('file_url, gallery_id').in('gallery_id', galleryIds),
  ])

  if (photosResult.error) throw new Error(photosResult.error.message)
  if (editedResult.error) throw new Error(editedResult.error.message)
  if (jobsResult.error) throw new Error(jobsResult.error.message)

  for (const photo of photosResult.data ?? []) {
    const row = photo as {
      original_url: string | null
      preview_url: string | null
      watermarked_preview_url: string | null
    }

    if (row.original_url) {
      storageDeletes.push({ bucket: 'originals', path: row.original_url })
    }
    if (row.preview_url) {
      storageDeletes.push({ bucket: 'previews', path: row.preview_url })
    }
    if (row.watermarked_preview_url) {
      storageDeletes.push({ bucket: 'watermarked', path: row.watermarked_preview_url })
    }
  }

  for (const row of editedResult.data ?? []) {
    const edited = row as { final_url: string | null }
    if (edited.final_url) {
      storageDeletes.push({ bucket: 'edited', path: edited.final_url })
    }
  }

  for (const row of jobsResult.data ?? []) {
    const job = row as { file_url: string | null }
    if (job.file_url) {
      storageDeletes.push({ bucket: 'zips', path: job.file_url })
    }
  }

  return { storageDeletes, rawKeys }
}

async function deleteUserR2Media(userId: string) {
  if (!isR2Configured()) return

  const admin = createAdminClient()

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select(
      'id, slug, studio_name, logo_url, hero_desktop_url, hero_mobile_url, hero_desktop_urls, hero_mobile_urls, about_image_url, contact_desktop_url, contact_mobile_url, packages_desktop_url, packages_mobile_url'
    )
    .eq('id', userId)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)
  if (!profile) throw new Error('סטודיו לא נמצא')

  const typedProfile = profile as UserProfileRow
  const { storageDeletes, rawKeys } = await collectGalleryMediaPaths(admin, userId)

  storageDeletes.push(...collectBrandingPaths(typedProfile))

  const { data: testimonials, error: testimonialsError } = await admin
    .from('testimonials')
    .select('image_url')
    .eq('user_id', userId)

  if (testimonialsError) throw new Error(testimonialsError.message)

  for (const testimonial of testimonials ?? []) {
    const parsed = parseTestimonialImageRef(
      (testimonial as { image_url: string | null }).image_url
    )
    if (parsed) {
      storageDeletes.push(parsed)
    }
  }

  for (let offset = 0; offset < storageDeletes.length; offset += DELETE_BATCH_SIZE) {
    const chunk = storageDeletes.slice(offset, offset + DELETE_BATCH_SIZE)
    await deleteMediaObjects(chunk)
  }

  await Promise.all(
    [...new Set(rawKeys)].map((key) =>
      deleteR2ObjectKey(key).catch(() => undefined)
    )
  )

  await Promise.all(
    MEDIA_BUCKETS.map((bucket) =>
      deleteMediaPrefix(bucket, `${userId}/`).catch(() => undefined)
    )
  )
}

async function deleteSlugRedirects(admin: ReturnType<typeof createAdminClient>, slug: string | null) {
  const normalized = slug?.trim()
  if (!normalized) return

  await admin.from('slug_redirects').delete().eq('old_slug', normalized)
  await admin.from('slug_redirects').delete().eq('new_slug', normalized)
}

export async function deleteStudioCompletely(userId: string) {
  const trimmedId = userId.trim()
  if (!trimmedId) {
    throw new Error('מזהה סטודיו חסר')
  }

  const admin = createAdminClient()

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('id, slug')
    .eq('id', trimmedId)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)
  if (!profile) throw new Error('סטודיו לא נמצא')

  await deleteUserR2Media(trimmedId)
  await deleteSlugRedirects(admin, (profile as { slug: string | null }).slug)

  const { error } = await admin.auth.admin.deleteUser(trimmedId)
  if (error) throw new Error(error.message)
}
