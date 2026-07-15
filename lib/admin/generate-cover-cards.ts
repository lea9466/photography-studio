import { deriveCoverCardStoragePath } from '@/lib/images/cover-process'
import { compressCoverCardBuffer } from '@/lib/images/cover-card.server'
import { isR2Configured } from '@/lib/r2/config'
import { downloadMediaObject, uploadMediaObject } from '@/lib/r2/storage'
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

function normalizeGalleryCoverStoragePath(coverImage: string): string | null {
  const trimmed = coverImage.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return null
  if (trimmed.startsWith('cover-images/')) return null
  if (trimmed.includes('_card.')) return null

  const path = trimmed.replace(/^branding\//, '')
  if (!path.includes('gallery_cover_v2_')) return null
  if (path.toLowerCase().endsWith('.svg')) return null

  return path
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
    const coverImage = gallery.cover_image
    if (!coverImage) {
      skipped++
      continue
    }

    const coverPath = normalizeGalleryCoverStoragePath(coverImage)
    if (!coverPath) {
      skipped++
      continue
    }

    const cardPath = deriveCoverCardStoragePath(coverPath)
    if (!cardPath) {
      skipped++
      continue
    }

    try {
      const originalBytes = await downloadMediaObject('branding', coverPath)
      const cardBytes = await compressCoverCardBuffer(Buffer.from(originalBytes))
      await uploadMediaObject('branding', cardPath, cardBytes, 'image/jpeg')
      regenerated++
    } catch (cause) {
      failed++
      const message =
        cause instanceof Error ? cause.message : 'יצירת תמונת כרטיס נכשלה'
      errors.push(`${gallery.id}: ${message}`)
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
