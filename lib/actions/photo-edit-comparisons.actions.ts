'use server'

import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug } from '@/lib/queries/public-photographer'
import { isR2Configured } from '@/lib/r2/config'
import { createPresignedUploadUrl, deleteMediaObject } from '@/lib/r2/storage'
import { actionError, actionSuccess, type ActionResult } from '@/lib/actions/action-result'
import { mapPhotoEditComparisonRow, mapPhotoEditComparisonRows } from '@/lib/mappers/photo-edit-comparison'
import {
  assertOwnedPhotoEditPath,
  parsePhotoEditImageRef,
} from '@/lib/photo-edit-image-url'
import { buildPhotoEditStoragePaths } from '@/lib/images/process'
import { GALLERY_PHOTO_MAX_BYTES, validateGalleryPhotoUpload } from '@/lib/media-upload-limits'
import type { PhotoEditComparison } from '@/lib/types/photo-edit-comparison'
import type { PhotoEditComparisonRow as DbRow } from '@/lib/types/database.types'
import {
  createPhotoEditComparisonSchema,
  updatePhotoEditComparisonSchema,
  zodFieldErrors,
} from '@/lib/validations/photo-edit-comparison'

async function revalidatePhotoEditSurfaces(userId?: string) {
  revalidatePath('/dashboard/photo-edits')
  revalidatePath('/[slug]', 'page')
  revalidatePath('/[slug]/before-after', 'page')
  revalidatePath('/[slug]/blog', 'page')
  revalidatePath('/[slug]/portfolio', 'page')

  if (!userId) return

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('users')
      .select('slug, studio_name')
      .eq('id', userId)
      .maybeSingle<{ slug: string | null; studio_name: string | null }>()

    const slug = data?.slug?.trim()
    if (slug) {
      revalidatePath(`/${slug}`)
      revalidatePath(`/${slug}/before-after`)
      revalidatePath(`/${slug}/blog`)
      revalidatePath(`/${slug}/portfolio`)
    }
  } catch {
    // Best-effort path revalidation
  }
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed ? trimmed : null
}

function assertOwnedPhotoEditImagePath(userId: string, imagePath: string) {
  const parsed = parsePhotoEditImageRef(imagePath, 'previews')
  if (!parsed || !assertOwnedPhotoEditPath(userId, parsed.path)) {
    throw new Error('תמונה לא תקינה')
  }
}

async function deletePhotoEditStoredPath(
  path: string | null | undefined,
  bucket: 'previews' | 'watermarked' | 'branding'
) {
  const parsed = parsePhotoEditImageRef(path, bucket)
  if (!parsed) return
  try {
    await deleteMediaObject(parsed.bucket, parsed.path)
  } catch {
    // Best-effort cleanup
  }
}

async function deletePhotoEditImagePair(
  previewPath: string | null | undefined,
  watermarkedPath: string | null | undefined
) {
  await deletePhotoEditStoredPath(previewPath, 'previews')
  await deletePhotoEditStoredPath(watermarkedPath, 'watermarked')
}

function formDataToObject(formData: FormData) {
  return {
    id: formData.get('id') ? String(formData.get('id')) : undefined,
    title: formData.has('title') ? String(formData.get('title') ?? '') : undefined,
    description: formData.has('description')
      ? String(formData.get('description') ?? '')
      : undefined,
    originalImageUrl: formData.has('originalImageUrl')
      ? String(formData.get('originalImageUrl') ?? '')
      : undefined,
    originalWatermarkedUrl: formData.has('originalWatermarkedUrl')
      ? String(formData.get('originalWatermarkedUrl') ?? '')
      : undefined,
    editedImageUrl: formData.has('editedImageUrl')
      ? String(formData.get('editedImageUrl') ?? '')
      : undefined,
    editedWatermarkedUrl: formData.has('editedWatermarkedUrl')
      ? String(formData.get('editedWatermarkedUrl') ?? '')
      : undefined,
    displayStyle: formData.has('displayStyle')
      ? String(formData.get('displayStyle') ?? 'development')
      : undefined,
    sortOrder: formData.has('sortOrder') ? Number(formData.get('sortOrder')) : undefined,
    isActive: formData.has('isActive')
      ? String(formData.get('isActive')) === 'true' || formData.get('isActive') === 'on'
      : undefined,
    autoApplyWatermark: formData.has('autoApplyWatermark')
      ? String(formData.get('autoApplyWatermark')) === 'true' ||
        formData.get('autoApplyWatermark') === 'on'
      : undefined,
    watermarkText: formData.has('watermarkText')
      ? String(formData.get('watermarkText') ?? '')
      : undefined,
  }
}

export async function getStudioPhotoEditComparisons(): Promise<ActionResult<PhotoEditComparison[]>> {
  try {
    const { userId, supabase } = await requireDashboardContext()

    const { data, error } = await supabase
      .from('photo_edit_comparisons')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return actionError(error.message)

    return actionSuccess(mapPhotoEditComparisonRows(data as DbRow[]))
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'יש להתחבר מחדש')
  }
}

export async function getPublicPhotoEditComparisonsByStudioSlug(
  slug: string
): Promise<ActionResult<PhotoEditComparison[]>> {
  try {
    const photographer = await findPhotographerBySlug(decodeURIComponent(slug))
    if (!photographer) return actionError('הסטודיו לא נמצא')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('photo_edit_comparisons')
      .select('*')
      .eq('user_id', photographer.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return actionError(error.message)

    return actionSuccess(mapPhotoEditComparisonRows(data as DbRow[]))
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'שגיאה בטעינת הנתונים')
  }
}

export async function countActivePhotoEditComparisons(userId: string): Promise<number> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('photo_edit_comparisons')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  return count ?? 0
}

export async function preparePhotoEditImageUpload(input: {
  comparisonId: string
  role: 'original' | 'edited'
  contentType: string
  fileSize: number
}): Promise<
  ActionResult<{
    previewUploadUrl: string
    watermarkedUploadUrl: string
    previewPath: string
    watermarkedPath: string
  }>
> {
  try {
    if (!isR2Configured()) {
      return actionError('אחסון תמונות לא מוגדר')
    }

    const { userId } = await requireDashboardContext()

    if (!input.comparisonId || !/^[0-9a-f-]{36}$/i.test(input.comparisonId)) {
      return actionError('מזהה זוג לא תקין')
    }
    if (input.role !== 'original' && input.role !== 'edited') {
      return actionError('סוג תמונה לא תקין')
    }

    try {
      validateGalleryPhotoUpload(input.contentType, input.fileSize)
    } catch (error) {
      return actionError(error instanceof Error ? error.message : 'קובץ לא תקין')
    }

    if (input.fileSize > GALLERY_PHOTO_MAX_BYTES) {
      return actionError('גודל הקובץ חורג מהמותר')
    }

    const paths = buildPhotoEditStoragePaths(userId, input.comparisonId, input.role)
    const [previewUploadUrl, watermarkedUploadUrl] = await Promise.all([
      createPresignedUploadUrl('previews', paths.previewPath, 'image/jpeg'),
      createPresignedUploadUrl('watermarked', paths.watermarkedPath, 'image/jpeg'),
    ])

    return actionSuccess({
      previewUploadUrl,
      watermarkedUploadUrl,
      previewPath: paths.previewPath,
      watermarkedPath: paths.watermarkedPath,
    })
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'שגיאה בהכנת ההעלאה')
  }
}

type DatabaseInsert = {
  id?: string
  user_id: string
  title: string | null
  description: string | null
  original_image_url: string
  original_watermarked_url: string
  edited_image_url: string
  edited_watermarked_url: string
  auto_apply_watermark: boolean
  watermark_text: string | null
  display_style: string
  sort_order: number
  is_active: boolean
}

export async function createPhotoEditComparison(
  formData: FormData
): Promise<ActionResult<PhotoEditComparison>> {
  try {
    const { userId, supabase } = await requireDashboardContext()
    const parsed = createPhotoEditComparisonSchema.safeParse(formDataToObject(formData))

    if (!parsed.success) {
      return actionError('יש לתקן את השגיאות בטופס', zodFieldErrors(parsed.error))
    }

    const input = parsed.data

    if (input.displayStyle !== 'development') {
      return actionError('סגנון התצוגה שנבחר עדיין לא זמין', {
        displayStyle: ['סגנון התצוגה שנבחר עדיין לא זמין'],
      })
    }

    try {
      assertOwnedPhotoEditImagePath(userId, input.originalImageUrl)
      assertOwnedPhotoEditImagePath(userId, input.originalWatermarkedUrl)
      assertOwnedPhotoEditImagePath(userId, input.editedImageUrl)
      assertOwnedPhotoEditImagePath(userId, input.editedWatermarkedUrl)
    } catch (error) {
      return actionError(error instanceof Error ? error.message : 'תמונה לא תקינה')
    }

    const { data: maxSort } = await supabase
      .from('photo_edit_comparisons')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle<{ sort_order: number }>()

    const sortOrder =
      input.sortOrder && input.sortOrder > 0
        ? input.sortOrder
        : (maxSort?.sort_order ?? -1) + 1

    const insertPayload: DatabaseInsert = {
      id: input.id,
      user_id: userId,
      title: normalizeOptionalText(input.title),
      description: normalizeOptionalText(input.description),
      original_image_url: input.originalImageUrl,
      original_watermarked_url: input.originalWatermarkedUrl,
      edited_image_url: input.editedImageUrl,
      edited_watermarked_url: input.editedWatermarkedUrl,
      auto_apply_watermark: input.autoApplyWatermark,
      watermark_text: normalizeOptionalText(input.watermarkText),
      display_style: 'development',
      sort_order: sortOrder,
      is_active: input.isActive,
    }

    const { data, error } = await supabase
      .from('photo_edit_comparisons')
      .insert(insertPayload as never)
      .select('*')
      .single()

    if (error) return actionError(error.message)

    await revalidatePhotoEditSurfaces(userId)
    return actionSuccess(mapPhotoEditComparisonRow(data as DbRow))
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'שגיאה ביצירת הזוג')
  }
}

export async function updatePhotoEditComparison(
  id: string,
  formData: FormData
): Promise<ActionResult<PhotoEditComparison>> {
  try {
    const { userId, supabase } = await requireDashboardContext()

    if (!id) return actionError('מזהה לא תקין')

    const parsed = updatePhotoEditComparisonSchema.safeParse(formDataToObject(formData))
    if (!parsed.success) {
      return actionError('יש לתקן את השגיאות בטופס', zodFieldErrors(parsed.error))
    }

    const input = parsed.data

    if (input.displayStyle && input.displayStyle !== 'development') {
      return actionError('סגנון התצוגה שנבחר עדיין לא זמין', {
        displayStyle: ['סגנון התצוגה שנבחר עדיין לא זמין'],
      })
    }

    const { data: existing, error: existingError } = await supabase
      .from('photo_edit_comparisons')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) return actionError(existingError.message)
    if (!existing) return actionError('הזוג לא נמצא')

    const existingRow = existing as DbRow
    const updateData: Record<string, unknown> = {}

    if (input.title !== undefined) updateData.title = normalizeOptionalText(input.title)
    if (input.description !== undefined) {
      updateData.description = normalizeOptionalText(input.description)
    }
    if (input.displayStyle !== undefined) updateData.display_style = input.displayStyle
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder
    if (input.isActive !== undefined) updateData.is_active = input.isActive
    if (input.autoApplyWatermark !== undefined) {
      updateData.auto_apply_watermark = input.autoApplyWatermark
    }
    if (input.watermarkText !== undefined) {
      updateData.watermark_text = normalizeOptionalText(input.watermarkText)
    }

    let previousOriginalPreview: string | null = null
    let previousOriginalWm: string | null = null
    let previousEditedPreview: string | null = null
    let previousEditedWm: string | null = null

    if (input.originalImageUrl !== undefined) {
      try {
        assertOwnedPhotoEditImagePath(userId, input.originalImageUrl)
        if (input.originalWatermarkedUrl) {
          assertOwnedPhotoEditImagePath(userId, input.originalWatermarkedUrl)
        }
      } catch (error) {
        return actionError(error instanceof Error ? error.message : 'תמונה לא תקינה')
      }
      if (input.originalImageUrl !== existingRow.original_image_url) {
        previousOriginalPreview = existingRow.original_image_url
        previousOriginalWm = existingRow.original_watermarked_url
        updateData.original_image_url = input.originalImageUrl
        updateData.original_watermarked_url =
          input.originalWatermarkedUrl ?? existingRow.original_watermarked_url
      }
    }

    if (input.editedImageUrl !== undefined) {
      try {
        assertOwnedPhotoEditImagePath(userId, input.editedImageUrl)
        if (input.editedWatermarkedUrl) {
          assertOwnedPhotoEditImagePath(userId, input.editedWatermarkedUrl)
        }
      } catch (error) {
        return actionError(error instanceof Error ? error.message : 'תמונה לא תקינה')
      }
      if (input.editedImageUrl !== existingRow.edited_image_url) {
        previousEditedPreview = existingRow.edited_image_url
        previousEditedWm = existingRow.edited_watermarked_url
        updateData.edited_image_url = input.editedImageUrl
        updateData.edited_watermarked_url =
          input.editedWatermarkedUrl ?? existingRow.edited_watermarked_url
      }
    }

    if (Object.keys(updateData).length === 0) {
      return actionSuccess(mapPhotoEditComparisonRow(existingRow))
    }

    const { data, error } = await supabase
      .from('photo_edit_comparisons')
      .update(updateData as never)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) return actionError(error.message)

    if (previousOriginalPreview) {
      await deletePhotoEditImagePair(previousOriginalPreview, previousOriginalWm)
    }
    if (previousEditedPreview) {
      await deletePhotoEditImagePair(previousEditedPreview, previousEditedWm)
    }

    await revalidatePhotoEditSurfaces(userId)
    return actionSuccess(mapPhotoEditComparisonRow(data as DbRow))
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'שגיאה בעדכון הזוג')
  }
}

export async function deletePhotoEditComparison(id: string): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireDashboardContext()

    const { data: existing, error: existingError } = await supabase
      .from('photo_edit_comparisons')
      .select(
        'id, original_image_url, original_watermarked_url, edited_image_url, edited_watermarked_url'
      )
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle<{
        id: string
        original_image_url: string
        original_watermarked_url: string
        edited_image_url: string
        edited_watermarked_url: string
      }>()

    if (existingError) return actionError(existingError.message)
    if (!existing) return actionError('הזוג לא נמצא')

    const { error } = await supabase
      .from('photo_edit_comparisons')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return actionError(error.message)

    await deletePhotoEditImagePair(
      existing.original_image_url,
      existing.original_watermarked_url
    )
    await deletePhotoEditImagePair(existing.edited_image_url, existing.edited_watermarked_url)

    await revalidatePhotoEditSurfaces(userId)
    return actionSuccess()
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'שגיאה במחיקת הזוג')
  }
}

export async function togglePhotoEditComparisonActive(
  id: string,
  isActive: boolean
): Promise<ActionResult<PhotoEditComparison>> {
  try {
    const { userId, supabase } = await requireDashboardContext()

    const { data, error } = await supabase
      .from('photo_edit_comparisons')
      .update({ is_active: isActive } as never)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) return actionError(error.message)
    if (!data) return actionError('הזוג לא נמצא')

    await revalidatePhotoEditSurfaces(userId)
    return actionSuccess(mapPhotoEditComparisonRow(data as DbRow))
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'שגיאה בעדכון הסטטוס')
  }
}

export async function reorderPhotoEditComparisons(
  items: { id: string; sortOrder: number }[]
): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireDashboardContext()

    if (!Array.isArray(items) || items.length === 0) {
      return actionError('רשימת סדר לא תקינה')
    }

    for (const item of items) {
      if (!item.id || typeof item.sortOrder !== 'number' || item.sortOrder < 0) {
        return actionError('רשימת סדר לא תקינה')
      }

      const { error } = await supabase
        .from('photo_edit_comparisons')
        .update({ sort_order: item.sortOrder } as never)
        .eq('id', item.id)
        .eq('user_id', userId)

      if (error) return actionError(error.message)
    }

    await revalidatePhotoEditSurfaces(userId)
    return actionSuccess()
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'שגיאה בשינוי הסדר')
  }
}
