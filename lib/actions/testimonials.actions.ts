'use server'

import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { isR2Configured } from '@/lib/r2/config'
import { createPresignedUploadUrl } from '@/lib/r2/storage'
import {
  formatTestimonialImageRef,
  getTestimonialImagePreviewUrl,
  parseTestimonialImageRef,
} from '@/lib/testimonial-image-url'
import { PRIMARY_IMAGE_MAX_BYTES, validatePrimaryImageFile } from '@/lib/media-upload-limits'
import type { Database } from '@/lib/types/database.types'

export async function getTestimonials() {
  const { userId, supabase } = await requireDashboardContext()

  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = PRIMARY_IMAGE_MAX_BYTES

// testimonials.image_url is always a "{bucket}:{path}" ref produced either by
// prepareTestimonialImageUpload (own upload, path = `${userId}/testimonials_...`)
// or getTestimonialPhotoOptions (an existing photo from one of the caller's OWN
// galleries, already filtered by user_id in that query, path = `${userId}/{galleryId}/...`).
// There is no free-text URL input for this field anywhere in the dashboard UI
// (unlike branding hero/about images), so — unlike assertOwnedBrandingRef —
// there is no legitimate external-URL case to preserve here: every non-empty
// value must parse and must be owned by the caller.
function assertOwnedTestimonialImageRef(userId: string, imageUrl: string | null | undefined) {
  if (!imageUrl) return
  const parsed = parseTestimonialImageRef(imageUrl)
  if (!parsed || !parsed.path.startsWith(`${userId}/`)) {
    throw new Error('תמונה לא תקינה')
  }
}

export async function prepareTestimonialImageUpload(input: {
  fileName: string
  contentType: string
  fileSize: number
}) {
  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  const { userId } = await requireDashboardContext()

  if (!ALLOWED_IMAGE_TYPES.includes(input.contentType)) {
    throw new Error('סוג הקובץ לא נתמך')
  }
  validatePrimaryImageFile(input.contentType, input.fileSize)

  const extension = input.fileName.split('.').pop() || 'jpg'
  const path = `${userId}/testimonials_${Date.now()}.${extension}`
  const uploadUrl = await createPresignedUploadUrl('branding', path, input.contentType)

  return {
    uploadUrl,
    storageRef: formatTestimonialImageRef('branding', path),
  }
}

export type TestimonialPhotoOption = {
  id: string
  galleryTitle: string
  storageRef: string
  previewUrl: string
}

export async function getTestimonialPhotoOptions(): Promise<TestimonialPhotoOption[]> {
  const { userId, supabase } = await requireDashboardContext()

  const { data: galleries, error: galleriesError } = await supabase
    .from('galleries')
    .select('id, title')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (galleriesError) throw new Error(galleriesError.message)

  const options: TestimonialPhotoOption[] = []

  for (const gallery of (galleries || []) as Array<{ id: string; title: string }>) {
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, preview_url')
      .eq('gallery_id', gallery.id)
      .not('preview_url', 'is', null)
      .order('sort_order', { ascending: true })
      .limit(60)

    if (photosError) throw new Error(photosError.message)

    for (const photo of (photos || []) as Array<{ id: string; preview_url: string | null }>) {
      if (!photo.preview_url) continue
      const storageRef = formatTestimonialImageRef('previews', photo.preview_url)
      options.push({
        id: photo.id,
        galleryTitle: gallery.title,
        storageRef,
        previewUrl: getTestimonialImagePreviewUrl(storageRef) || '',
      })
    }
  }

  return options
}

export async function createTestimonial(data: {
  title: string
  content: string
  shootType?: string
  reviewDate?: string
  isFeatured?: boolean
  imageUrl?: string | null
}) {
  const { userId, supabase } = await requireDashboardContext()

  assertOwnedTestimonialImageRef(userId, data.imageUrl)

  const { error } = await supabase.from('testimonials').insert({
    user_id: userId,
    title: data.title,
    content: data.content,
    shoot_type: data.shootType || null,
    review_date: data.reviewDate || null,
    is_featured: data.isFeatured || false,
    image_url: data.imageUrl || null,
  } as never)

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function updateTestimonial(id: string, data: {
  title?: string
  content?: string
  shootType?: string
  reviewDate?: string
  isFeatured?: boolean
  sortOrder?: number
  imageUrl?: string | null
}) {
  const { userId, supabase } = await requireDashboardContext()

  const updateData: Record<string, any> = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.shootType !== undefined) updateData.shoot_type = data.shootType || null
  if (data.reviewDate !== undefined) updateData.review_date = data.reviewDate || null
  if (data.isFeatured !== undefined) updateData.is_featured = data.isFeatured
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder
  if (data.imageUrl !== undefined) {
    assertOwnedTestimonialImageRef(userId, data.imageUrl)
    updateData.image_url = data.imageUrl || null
  }

  const { error } = await supabase
    .from('testimonials')
    .update(updateData as never)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function deleteTestimonial(id: string) {
  const { userId, supabase } = await requireDashboardContext()

  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function reorderTestimonials(testimonials: { id: string; sortOrder: number }[]) {
  const { userId, supabase } = await requireDashboardContext()

  for (const testimonial of testimonials) {
    const { error } = await supabase
      .from('testimonials')
      .update({ sort_order: testimonial.sortOrder } as never)
      .eq('id', testimonial.id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  return { success: true }
}

export async function updateTestimonialsSectionTitle(input: {
  title?: string
}): Promise<{ testimonials_title: string | null }> {
  const { userId, supabase } = await requireDashboardContext()

  if (input.title === undefined) {
    throw new Error('אין שינויים לשמירה')
  }

  const payload: Database['public']['Tables']['users']['Update'] = {
    testimonials_title: input.title.trim() || null,
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload as never)
    .eq('id', userId)
    .select('testimonials_title')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/reviews')
  revalidatePath('/portfolio')
  revalidatePath('/[slug]', 'page')

  return data as { testimonials_title: string | null }
}

export async function updateTestimonialLayoutType(input: {
  layoutType: 'carousel' | 'marquee'
}): Promise<{ testimonial_layout_type: string }> {
  if (input.layoutType !== 'carousel' && input.layoutType !== 'marquee') {
    throw new Error('סוג תצוגה לא תקין')
  }

  const { userId, supabase } = await requireDashboardContext()

  const payload: Database['public']['Tables']['users']['Update'] = {
    testimonial_layout_type: input.layoutType,
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload as never)
    .eq('id', userId)
    .select('testimonial_layout_type')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/reviews')
  revalidatePath('/portfolio')
  revalidatePath('/[slug]', 'page')

  return data as { testimonial_layout_type: string }
}

// Public function to get testimonials for a specific photographer (by their slug or user_id)
export async function getPublicTestimonials(userId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('user_id', userId)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('review_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data
}
