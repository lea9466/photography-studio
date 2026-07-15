import {
  deriveCoverCardStoragePath,
  normalizeGalleryCoverStoragePath,
} from '@/lib/images/cover-process'
import { compressCoverCardBuffer } from '@/lib/images/cover-card.server'
import { isR2Configured } from '@/lib/r2/config'
import {
  deleteMediaObject,
  downloadMediaObject,
  mediaObjectExists,
  uploadMediaObject,
} from '@/lib/r2/storage'
import { createAdminClient } from '@/lib/supabase/admin'

const BATCH_SIZE = 20

export type GenerateMissingGalleryCoverCardsResult = {
  regenerated: number
  skipped: number
  failed: number
  errors: string[]
  hasMore: boolean
  nextOffset: number
  totalEligible: number
}

async function migrateGalleryCoverToDisplayOnly(
  admin: ReturnType<typeof createAdminClient>,
  gallery: {
    id: string
    cover_image: string | null
  }
): Promise<'regenerated' | 'skipped' | { failed: string }> {
  const coverImage = gallery.cover_image
  if (!coverImage) return 'skipped'

  const coverPath = normalizeGalleryCoverStoragePath(coverImage)
  if (!coverPath) return 'skipped'

  const cardPath = deriveCoverCardStoragePath(coverPath)
  if (!cardPath) return 'skipped'

  try {
    const originalExists = await mediaObjectExists('branding', coverPath)
    if (!originalExists) {
      const cardExists = await mediaObjectExists('branding', cardPath)
      if (cardExists && gallery.cover_image !== cardPath) {
        const { error } = await admin
          .from('galleries')
          .update({ cover_image: cardPath } as never)
          .eq('id', gallery.id)
        if (error) throw new Error(error.message)
      }
      return 'skipped'
    }

    const originalBytes = await downloadMediaObject('branding', coverPath)
    const cardBytes = await compressCoverCardBuffer(Buffer.from(originalBytes))
    await uploadMediaObject('branding', cardPath, cardBytes, 'image/jpeg')
    await deleteMediaObject('branding', coverPath)

    const { error } = await admin
      .from('galleries')
      .update({ cover_image: cardPath } as never)
      .eq('id', gallery.id)

    if (error) throw new Error(error.message)

    return 'regenerated'
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'יצירת תמונת כרטיס נכשלה'
    return { failed: message }
  }
}

export async function generateMissingGalleryCoverCardsBatch(
  offset = 0
): Promise<GenerateMissingGalleryCoverCardsResult> {
  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  const admin = createAdminClient()
  const safeOffset = Math.max(0, offset)

  const { count, error: countError } = await admin
    .from('galleries')
    .select('id', { count: 'exact', head: true })
    .not('cover_image', 'is', null)
    .ilike('cover_image', '%gallery_cover_v2_%')
    .not('cover_image', 'ilike', '%_card.%')

  if (countError) throw new Error(countError.message)

  const totalEligible = count ?? 0
  if (totalEligible === 0 || safeOffset >= totalEligible) {
    return {
      regenerated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      hasMore: false,
      nextOffset: 0,
      totalEligible,
    }
  }

  const { data, error } = await admin
    .from('galleries')
    .select('id, cover_image')
    .not('cover_image', 'is', null)
    .ilike('cover_image', '%gallery_cover_v2_%')
    .not('cover_image', 'ilike', '%_card.%')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .range(safeOffset, safeOffset + BATCH_SIZE - 1)

  if (error) throw new Error(error.message)

  let regenerated = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []

  for (const row of data ?? []) {
    const gallery = row as { id: string; cover_image: string | null }
    const result = await migrateGalleryCoverToDisplayOnly(admin, gallery)

    if (result === 'regenerated') {
      regenerated++
    } else if (result === 'skipped') {
      skipped++
    } else {
      failed++
      errors.push(`${gallery.id}: ${result.failed}`)
    }
  }

  const processedCount = (data ?? []).length
  const nextOffset = safeOffset + processedCount
  const hasMore = nextOffset < totalEligible

  return {
    regenerated,
    skipped,
    failed,
    errors,
    hasMore,
    nextOffset: hasMore ? nextOffset : 0,
    totalEligible,
  }
}
