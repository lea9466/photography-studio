import { createAdminClient } from '@/lib/supabase/admin'
import { deleteMediaObject, mediaObjectExists } from '@/lib/r2/storage'
import { isR2Configured } from '@/lib/r2/config'

const BATCH_SIZE = 50

export type OriginalCleanupSource = 'gallery' | 'post'

export type OriginalCleanupCandidate = {
  photoId: string
  source: OriginalCleanupSource
  studioName: string | null
  contextTitle: string | null
  contextKind: 'גלריה' | 'פוסט'
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

async function countEligibleOriginals(admin: ReturnType<typeof createAdminClient>) {
  const [galleryCountResult, postCountResult] = await Promise.all([
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
  ])

  if (galleryCountResult.error) throw new Error(galleryCountResult.error.message)
  if (postCountResult.error) throw new Error(postCountResult.error.message)

  return {
    galleryCount: galleryCountResult.count ?? 0,
    postCount: postCountResult.count ?? 0,
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

export async function scanGalleryOriginalsCleanupBatch(
  offset = 0
): Promise<ScanGalleryOriginalsCleanupResult> {
  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  const admin = createAdminClient()
  const safeOffset = Math.max(0, offset)
  const { galleryCount, postCount } = await countEligibleOriginals(admin)
  const totalEligible = galleryCount + postCount

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
    const postFrom = cursor - galleryCount
    const postTo = Math.min(postFrom + remaining - 1, postCount - 1)
    if (postFrom <= postTo) {
      candidates.push(...(await fetchPostCandidates(admin, postFrom, postTo)))
    }
  }

  const nextOffset = safeOffset + candidates.length
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

  const [galleryRows, postRows] = await Promise.all([
    galleryIds.length > 0
      ? admin.from('photos').select('id, original_url, preview_url').in('id', galleryIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? admin.from('post_photos').select('id, original_url, preview_url').in('id', postIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (galleryRows.error) throw new Error(galleryRows.error.message)
  if (postRows.error) throw new Error(postRows.error.message)

  let deleted = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []
  const clearedGalleryIds: string[] = []
  const clearedPostIds: string[] = []

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

  return { deleted, skipped, failed, errors }
}
