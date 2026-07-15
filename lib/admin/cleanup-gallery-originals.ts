import { createAdminClient } from '@/lib/supabase/admin'
import {
  deriveCoverCardStoragePath,
  deriveLegacyCoverOriginalCandidates,
  isGalleryCoverCardPath,
  normalizeGalleryCoverStoragePath,
} from '@/lib/images/cover-process'
import { deleteMediaObject, mediaObjectExists } from '@/lib/r2/storage'
import { isR2Configured } from '@/lib/r2/config'

const BATCH_SIZE = 50

export type OriginalCleanupSource = 'gallery' | 'post' | 'cover'

export type OriginalCleanupCandidate = {
  photoId: string
  source: OriginalCleanupSource
  studioName: string | null
  contextTitle: string | null
  contextKind: 'גלריה' | 'פוסט' | 'שער גלריה'
  originalPath: string
  previewPath: string
  storageKey: string
  previewStorageKey: string
}

/** @deprecated Use OriginalCleanupCandidate */
export type GalleryOriginalCleanupCandidate = OriginalCleanupCandidate

export type ScanGalleryOriginalsCleanupResult = {
  candidates: OriginalCleanupCandidate[]
  hasMore: boolean
  nextOffset: number
  totalEligible: number
}

export type DeleteGalleryOriginalsCleanupResult = {
  deleted: number
  skipped: number
  failed: number
  errors: string[]
}

export type OriginalCleanupTarget = {
  id: string
  source: OriginalCleanupSource
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function resolveStudioName(
  user:
    | { studio_name: string | null; name: string | null }
    | { studio_name: string | null; name: string | null }[]
    | null
    | undefined
) {
  const row = unwrapRelation(user ?? null)
  return row?.studio_name?.trim() || row?.name?.trim() || null
}

function mapGalleryCandidate(row: {
  id: string
  original_url: string
  preview_url: string
  galleries:
    | {
        title: string | null
        users:
          | { studio_name: string | null; name: string | null }
          | { studio_name: string | null; name: string | null }[]
          | null
      }
    | {
        title: string | null
        users:
          | { studio_name: string | null; name: string | null }
          | { studio_name: string | null; name: string | null }[]
          | null
      }[]
    | null
}): OriginalCleanupCandidate {
  const gallery = unwrapRelation(row.galleries)

  return {
    photoId: row.id,
    source: 'gallery',
    studioName: resolveStudioName(gallery?.users ?? null),
    contextTitle: gallery?.title ?? null,
    contextKind: 'גלריה',
    originalPath: row.original_url,
    previewPath: row.preview_url,
    storageKey: `originals/${row.original_url}`,
    previewStorageKey: `previews/${row.preview_url}`,
  }
}

function mapPostCandidate(row: {
  id: string
  original_url: string
  preview_url: string
  posts:
    | {
        title: string | null
        users:
          | { studio_name: string | null; name: string | null }
          | { studio_name: string | null; name: string | null }[]
          | null
      }
    | {
        title: string | null
        users:
          | { studio_name: string | null; name: string | null }
          | { studio_name: string | null; name: string | null }[]
          | null
      }[]
    | null
}): OriginalCleanupCandidate {
  const post = unwrapRelation(row.posts)

  return {
    photoId: row.id,
    source: 'post',
    studioName: resolveStudioName(post?.users ?? null),
    contextTitle: post?.title ?? null,
    contextKind: 'פוסט',
    originalPath: row.original_url,
    previewPath: row.preview_url,
    storageKey: `originals/${row.original_url}`,
    previewStorageKey: `previews/${row.preview_url}`,
  }
}

async function resolveCoverCleanupCandidate(row: {
  id: string
  title: string | null
  cover_image: string | null
  users:
    | { studio_name: string | null; name: string | null }
    | { studio_name: string | null; name: string | null }[]
    | null
}): Promise<OriginalCleanupCandidate | null> {
  const coverImage = row.cover_image?.trim()
  if (!coverImage || coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
    return null
  }

  let originalPath: string | null = null
  let cardPath: string | null = null

  if (isGalleryCoverCardPath(coverImage)) {
    cardPath = coverImage.replace(/^branding\//, '')
    for (const candidate of deriveLegacyCoverOriginalCandidates(cardPath)) {
      if (await mediaObjectExists('branding', candidate)) {
        originalPath = candidate
        break
      }
    }
  } else {
    originalPath = normalizeGalleryCoverStoragePath(coverImage)
    cardPath = originalPath ? deriveCoverCardStoragePath(originalPath) : null
    if (!originalPath || !cardPath) return null
    if (!(await mediaObjectExists('branding', originalPath))) return null
  }

  if (!originalPath || !cardPath) return null
  if (!(await mediaObjectExists('branding', cardPath))) return null

  return {
    photoId: row.id,
    source: 'cover',
    studioName: resolveStudioName(row.users),
    contextTitle: row.title,
    contextKind: 'שער גלריה',
    originalPath,
    previewPath: cardPath,
    storageKey: `branding/${originalPath}`,
    previewStorageKey: `branding/${cardPath}`,
  }
}

async function countEligibleOriginals(admin: ReturnType<typeof createAdminClient>) {
  const [galleryCountResult, postCountResult, coverCountResult] = await Promise.all([
    admin
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .not('original_url', 'is', null)
      .not('preview_url', 'is', null),
    admin
      .from('post_photos')
      .select('id', { count: 'exact', head: true })
      .not('original_url', 'is', null)
      .not('preview_url', 'is', null),
    admin
      .from('galleries')
      .select('id', { count: 'exact', head: true })
      .not('cover_image', 'is', null)
      .ilike('cover_image', '%gallery_cover_v2_%'),
  ])

  if (galleryCountResult.error) throw new Error(galleryCountResult.error.message)
  if (postCountResult.error) throw new Error(postCountResult.error.message)
  if (coverCountResult.error) throw new Error(coverCountResult.error.message)

  return {
    galleryCount: galleryCountResult.count ?? 0,
    postCount: postCountResult.count ?? 0,
    coverCount: coverCountResult.count ?? 0,
  }
}

async function fetchGalleryCandidates(
  admin: ReturnType<typeof createAdminClient>,
  from: number,
  to: number
) {
  if (from > to) return []

  const { data, error } = await admin
    .from('photos')
    .select('id, original_url, preview_url, galleries(title, users(studio_name, name))')
    .not('original_url', 'is', null)
    .not('preview_url', 'is', null)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw new Error(error.message)

  return ((data ?? []) as Parameters<typeof mapGalleryCandidate>[0][]).map(mapGalleryCandidate)
}

async function fetchPostCandidates(
  admin: ReturnType<typeof createAdminClient>,
  from: number,
  to: number
) {
  if (from > to) return []

  const { data, error } = await admin
    .from('post_photos')
    .select(
      'id, original_url, preview_url, posts!post_photos_post_id_fkey(title, users!posts_user_id_fkey(studio_name, name))'
    )
    .not('original_url', 'is', null)
    .not('preview_url', 'is', null)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw new Error(error.message)

  return ((data ?? []) as Parameters<typeof mapPostCandidate>[0][]).map(mapPostCandidate)
}

async function fetchCoverCandidates(
  admin: ReturnType<typeof createAdminClient>,
  from: number,
  to: number
) {
  if (from > to) return []

  const { data, error } = await admin
    .from('galleries')
    .select('id, title, cover_image, users(studio_name, name)')
    .not('cover_image', 'is', null)
    .ilike('cover_image', '%gallery_cover_v2_%')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw new Error(error.message)

  const candidates: OriginalCleanupCandidate[] = []
  for (const row of (data ?? []) as Parameters<typeof resolveCoverCleanupCandidate>[0][]) {
    const candidate = await resolveCoverCleanupCandidate(row)
    if (candidate) candidates.push(candidate)
  }

  return candidates
}

export async function scanGalleryOriginalsCleanupBatch(
  offset = 0
): Promise<ScanGalleryOriginalsCleanupResult> {
  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  const admin = createAdminClient()
  const safeOffset = Math.max(0, offset)
  const { galleryCount, postCount, coverCount } = await countEligibleOriginals(admin)
  const totalEligible = galleryCount + postCount + coverCount

  if (totalEligible === 0 || safeOffset >= totalEligible) {
    return {
      candidates: [],
      hasMore: false,
      nextOffset: 0,
      totalEligible,
    }
  }

  const candidates: OriginalCleanupCandidate[] = []
  let remaining = BATCH_SIZE
  let cursor = safeOffset

  if (cursor < galleryCount && remaining > 0) {
    const galleryFrom = cursor
    const galleryTo = Math.min(galleryFrom + remaining - 1, galleryCount - 1)
    candidates.push(...(await fetchGalleryCandidates(admin, galleryFrom, galleryTo)))
    remaining -= galleryTo - galleryFrom + 1
    cursor = galleryTo + 1
  }

  if (remaining > 0 && cursor >= galleryCount) {
    const postFrom = Math.max(0, cursor - galleryCount)
    const postTo = Math.min(postFrom + remaining - 1, postCount - 1)
    if (postFrom <= postTo) {
      candidates.push(...(await fetchPostCandidates(admin, postFrom, postTo)))
      remaining -= postTo - postFrom + 1
      cursor = galleryCount + postTo + 1
    } else {
      cursor = galleryCount + postCount
    }
  }

  if (remaining > 0 && cursor >= galleryCount + postCount) {
    const coverFrom = cursor - galleryCount - postCount
    const coverTo = Math.min(coverFrom + remaining - 1, coverCount - 1)
    if (coverFrom <= coverTo) {
      candidates.push(...(await fetchCoverCandidates(admin, coverFrom, coverTo)))
    }
  }

  const rowsConsumed = Math.min(BATCH_SIZE, totalEligible - safeOffset)
  const nextOffset = safeOffset + rowsConsumed
  const hasMore = nextOffset < totalEligible

  return {
    candidates,
    hasMore,
    nextOffset: hasMore ? nextOffset : 0,
    totalEligible,
  }
}

async function deleteOriginalRow(input: {
  id: string
  original_url: string | null
  preview_url: string | null
}) {
  if (!input.original_url || !input.preview_url) {
    return { status: 'skipped' as const, error: null }
  }

  const previewExists = await mediaObjectExists('previews', input.preview_url)
  if (!previewExists) {
    return {
      status: 'skipped' as const,
      error: `${input.id}: preview חסר — המקור לא נמחק`,
    }
  }

  try {
    await deleteMediaObject('originals', input.original_url)
    return { status: 'deleted' as const, error: null }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'מחיקה נכשלה'
    return { status: 'failed' as const, error: `${input.id}: ${message}` }
  }
}

async function deleteCoverOriginalRow(input: {
  id: string
  cover_image: string | null
  originalPath: string
  cardPath: string
}) {
  const cardExists = await mediaObjectExists('branding', input.cardPath)
  if (!cardExists) {
    return {
      status: 'skipped' as const,
      error: `${input.id}: קובץ _card חסר — המקור לא נמחק`,
      updateCoverImage: null as string | null,
    }
  }

  const originalExists = await mediaObjectExists('branding', input.originalPath)
  if (!originalExists) {
    const current = input.cover_image?.replace(/^branding\//, '').trim() ?? ''
    const updateCoverImage = current !== input.cardPath ? input.cardPath : null
    return { status: 'skipped' as const, error: null, updateCoverImage }
  }

  try {
    await deleteMediaObject('branding', input.originalPath)
    const current = input.cover_image?.replace(/^branding\//, '').trim() ?? ''
    const updateCoverImage = current !== input.cardPath ? input.cardPath : null
    return { status: 'deleted' as const, error: null, updateCoverImage }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'מחיקה נכשלה'
    return { status: 'failed' as const, error: `${input.id}: ${message}`, updateCoverImage: null }
  }
}

export async function deleteGalleryOriginalsCleanupBatch(
  targets: OriginalCleanupTarget[]
): Promise<DeleteGalleryOriginalsCleanupResult> {
  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  if (targets.length === 0) {
    return { deleted: 0, skipped: 0, failed: 0, errors: [] }
  }

  const admin = createAdminClient()
  const galleryIds = targets.filter((target) => target.source === 'gallery').map((target) => target.id)
  const postIds = targets.filter((target) => target.source === 'post').map((target) => target.id)
  const coverIds = targets.filter((target) => target.source === 'cover').map((target) => target.id)

  const [galleryRows, postRows, coverRows] = await Promise.all([
    galleryIds.length > 0
      ? admin.from('photos').select('id, original_url, preview_url').in('id', galleryIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? admin.from('post_photos').select('id, original_url, preview_url').in('id', postIds)
      : Promise.resolve({ data: [], error: null }),
    coverIds.length > 0
      ? admin
          .from('galleries')
          .select('id, title, cover_image, users(studio_name, name)')
          .in('id', coverIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (galleryRows.error) throw new Error(galleryRows.error.message)
  if (postRows.error) throw new Error(postRows.error.message)
  if (coverRows.error) throw new Error(coverRows.error.message)

  let deleted = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []
  const clearedGalleryIds: string[] = []
  const clearedPostIds: string[] = []
  const coverImageUpdates: { id: string; cover_image: string }[] = []

  for (const row of galleryRows.data ?? []) {
    const photo = row as { id: string; original_url: string | null; preview_url: string | null }
    const result = await deleteOriginalRow(photo)
    if (result.status === 'deleted') {
      clearedGalleryIds.push(photo.id)
      deleted++
    } else if (result.status === 'skipped') {
      skipped++
      if (result.error) errors.push(result.error)
    } else {
      failed++
      if (result.error) errors.push(result.error)
    }
  }

  for (const row of postRows.data ?? []) {
    const photo = row as { id: string; original_url: string | null; preview_url: string | null }
    const result = await deleteOriginalRow(photo)
    if (result.status === 'deleted') {
      clearedPostIds.push(photo.id)
      deleted++
    } else if (result.status === 'skipped') {
      skipped++
      if (result.error) errors.push(result.error)
    } else {
      failed++
      if (result.error) errors.push(result.error)
    }
  }

  for (const row of coverRows.data ?? []) {
    const gallery = row as {
      id: string
      title: string | null
      cover_image: string | null
      users:
        | { studio_name: string | null; name: string | null }
        | { studio_name: string | null; name: string | null }[]
        | null
    }
    const candidate = await resolveCoverCleanupCandidate(gallery)
    if (!candidate) {
      skipped++
      continue
    }

    const result = await deleteCoverOriginalRow({
      id: gallery.id,
      cover_image: gallery.cover_image,
      originalPath: candidate.originalPath,
      cardPath: candidate.previewPath,
    })

    if (result.status === 'deleted') {
      deleted++
      if (result.updateCoverImage) {
        coverImageUpdates.push({ id: gallery.id, cover_image: result.updateCoverImage })
      }
    } else if (result.status === 'skipped') {
      skipped++
      if (result.error) errors.push(result.error)
      if (result.updateCoverImage) {
        coverImageUpdates.push({ id: gallery.id, cover_image: result.updateCoverImage })
      }
    } else {
      failed++
      if (result.error) errors.push(result.error)
    }
  }

  if (clearedGalleryIds.length > 0) {
    const { error: updateError } = await admin
      .from('photos')
      .update({ original_url: null } as never)
      .in('id', clearedGalleryIds)

    if (updateError) throw new Error(updateError.message)
  }

  if (clearedPostIds.length > 0) {
    const { error: updateError } = await admin
      .from('post_photos')
      .update({ original_url: null } as never)
      .in('id', clearedPostIds)

    if (updateError) throw new Error(updateError.message)
  }

  for (const update of coverImageUpdates) {
    const { error: updateError } = await admin
      .from('galleries')
      .update({ cover_image: update.cover_image } as never)
      .eq('id', update.id)

    if (updateError) throw new Error(updateError.message)
  }

  return { deleted, skipped, failed, errors }
}
