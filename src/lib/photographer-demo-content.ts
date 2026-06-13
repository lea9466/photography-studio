import 'server-only'

import { randomBytes } from 'crypto'
import {
  DEMO_GALLERY_ITEMS,
  DEMO_GALLERY_TITLES,
  LEGACY_DEMO_GALLERY_TITLES,
} from '@/lib/demo-galleries'
import {
  DEFAULT_PACKAGES,
  DEFAULT_PACKAGE_TITLES,
} from '@/lib/default-packages'
import { getAdminClient } from '@/lib/supabase-admin'

type DemoAlbumRow = {
  id: string
  title: string | null
  cover_image: string | null
  created_at: string
}

const GALLERY_CLIENT_NAME = 'גלריה כללית'
const GALLERY_CLIENT_EMAIL = 'gallery@studio.internal'

const GENERIC_ABOUT =
  'ברוכים הבאים לאתר הסטודיו. כאן תוכלו לצפות בעבודות, לבחור חבילה וליצור קשר.'

async function ensureGalleryClientId(
  sb: NonNullable<ReturnType<typeof getAdminClient>>,
  photographerId: string
): Promise<string | null> {
  const { data: existing } = await sb
    .from('clients')
    .select('id')
    .eq('photographer_id', photographerId)
    .eq('full_name', GALLERY_CLIENT_NAME)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data: anyClient } = await sb
    .from('clients')
    .select('id')
    .eq('photographer_id', photographerId)
    .limit(1)
    .maybeSingle()

  if (anyClient?.id) return anyClient.id

  const { data: user, error: userError } = await sb
    .from('users')
    .insert({
      email: `${photographerId.slice(0, 8)}-${GALLERY_CLIENT_EMAIL}`,
      role: 'client',
      access_code: null,
    })
    .select('id')
    .single()

  if (userError || !user) {
    console.error('ensureDemoGalleryClient user:', userError?.message)
    return null
  }

  const { data: client, error: clientError } = await sb
    .from('clients')
    .insert({
      user_id: user.id,
      photographer_id: photographerId,
      full_name: GALLERY_CLIENT_NAME,
      phone: null,
    })
    .select('id')
    .single()

  if (clientError || !client) {
    console.error('ensureDemoGalleryClient client:', clientError?.message)
    return null
  }

  return client.id
}

/** שומר בדיוק 3 גלריות דemo — אחת לכל כותרת, מוחק כפילויות. */
export async function ensureDemoContentForPhotographer(
  photographerId: string
): Promise<void> {
  const sb = getAdminClient()
  if (!sb) return

  const { data: settings } = await sb
    .from('site_settings')
    .select('id, about_text')
    .eq('photographer_id', photographerId)
    .maybeSingle()

  if (settings && !settings.about_text?.trim()) {
    await sb
      .from('site_settings')
      .update({ about_text: GENERIC_ABOUT })
      .eq('id', settings.id)
  }

  const { data: legacyAlbums } = await sb
    .from('albums')
    .select('id')
    .eq('photographer_id', photographerId)
    .in('title', [...LEGACY_DEMO_GALLERY_TITLES])

  if (legacyAlbums?.length) {
    await sb
      .from('albums')
      .delete()
      .in(
        'id',
        legacyAlbums.map((row) => row.id)
      )
  }

  const { data: demoAlbums } = await sb
    .from('albums')
    .select('id, title, cover_image, created_at')
    .eq('photographer_id', photographerId)
    .in('title', [...DEMO_GALLERY_TITLES])
    .order('created_at', { ascending: true })

  const byTitle = new Map<string, DemoAlbumRow[]>()
  for (const album of demoAlbums ?? []) {
    if (!album.title) continue
    const list = byTitle.get(album.title) ?? []
    list.push(album)
    byTitle.set(album.title, list)
  }

  const duplicateIds: string[] = []
  for (const albums of byTitle.values()) {
    if (albums.length <= 1) continue
    duplicateIds.push(...albums.slice(1).map((a) => a.id))
  }

  if (duplicateIds.length > 0) {
    await sb.from('albums').delete().in('id', duplicateIds)
  }

  const keptByTitle = new Map<string, DemoAlbumRow>()
  for (const [title, albums] of byTitle) {
    keptByTitle.set(title, albums[0])
  }

  const clientId = await ensureGalleryClientId(sb, photographerId)
  if (!clientId) return

  for (const demo of DEMO_GALLERY_ITEMS) {
    const existing = keptByTitle.get(demo.title)

    if (existing) {
      if (existing.cover_image !== demo.cover) {
        await sb
          .from('albums')
          .update({ cover_image: demo.cover })
          .eq('id', existing.id)
      }
      continue
    }

    await sb.from('albums').insert({
      client_id: clientId,
      photographer_id: photographerId,
      title: demo.title,
      cover_image: demo.cover,
      status: 'active',
      is_public: true,
      access_token: randomBytes(18).toString('hex'),
    })
  }

  await ensureDefaultPackagesForPhotographer(photographerId)
}

type DemoPackageRow = {
  id: string
  title: string | null
  created_at: string
}

const DEFAULT_TITLE_SET = new Set<string>(DEFAULT_PACKAGE_TITLES)

/** שומר בדיוק 3 חבילות גנריות — אחת לכל כותרת, מוחק כפילויות ומיותר. */
export async function ensureDefaultPackagesForPhotographer(
  photographerId: string
): Promise<void> {
  const sb = getAdminClient()
  if (!sb) return

  const { data: existing } = await sb
    .from('packages')
    .select('id, title, created_at')
    .eq('photographer_id', photographerId)
    .order('created_at', { ascending: true })

  const byTitle = new Map<string, DemoPackageRow[]>()
  const extraIds: string[] = []

  for (const row of existing ?? []) {
    const title = row.title?.trim()
    if (!title || !DEFAULT_TITLE_SET.has(title)) {
      extraIds.push(row.id)
      continue
    }
    const list = byTitle.get(title) ?? []
    list.push(row)
    byTitle.set(title, list)
  }

  const duplicateIds: string[] = []
  const keptByTitle = new Map<string, DemoPackageRow>()

  for (const [title, rows] of byTitle) {
    keptByTitle.set(title, rows[0])
    if (rows.length > 1) {
      duplicateIds.push(...rows.slice(1).map((row) => row.id))
    }
  }

  const toDelete = [...extraIds, ...duplicateIds]
  if (toDelete.length > 0) {
    await sb.from('packages').delete().in('id', toDelete)
  }

  const missing = DEFAULT_PACKAGES.filter((pkg) => !keptByTitle.has(pkg.title))
  if (missing.length === 0) return

  const rows = missing.map((pkg) => ({
    photographer_id: photographerId,
    title: pkg.title,
    description: pkg.description,
    price: pkg.price,
    features: pkg.features,
    is_featured: pkg.is_featured,
    is_active: true,
    sort_order: pkg.sort_order,
  }))

  const { error } = await sb.from('packages').insert(rows)
  if (error) {
    console.error('ensureDefaultPackages:', error.message)
  }
}

export { DEFAULT_PACKAGE_TITLES }
