import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = (env.NEXT_PUBLIC_APP_URL || 'https://studio-galleries.com').replace(/\/$/, '')

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function getStudioPath(slug, studioName) {
  if (slug?.trim()) return `/${slug.trim()}`
  if (studioName?.trim()) return `/${encodeURIComponent(studioName.trim())}`
  return null
}

function getGalleryPath(gallery) {
  if (gallery.gallery_type === 'portfolio' && gallery.slug?.trim()) {
    return `/portfolio/${gallery.slug.trim()}`
  }
  return `/public-gallery/${gallery.id}`
}

// Fetch all data
const { data: users, error: usersError } = await admin
  .from('users')
  .select('id, email, name, studio_name, slug, created_at')

if (usersError) throw usersError

const { data: galleries, error: galleriesError } = await admin
  .from('galleries')
  .select('id, user_id, title, slug, gallery_type, is_public, created_at')

if (galleriesError) throw galleriesError

const { data: photos, error: photosError } = await admin
  .from('photos')
  .select('id, gallery_id')

if (photosError) throw photosError

// Count photos per gallery
const photoCountByGallery = new Map()
for (const photo of photos ?? []) {
  photoCountByGallery.set(
    photo.gallery_id,
    (photoCountByGallery.get(photo.gallery_id) ?? 0) + 1
  )
}

// Group galleries by user with photo counts
const galleriesByUser = new Map()
for (const gallery of galleries ?? []) {
  const photoCount = photoCountByGallery.get(gallery.id) ?? 0
  if (photoCount < 2) continue

  const list = galleriesByUser.get(gallery.user_id) ?? []
  list.push({ ...gallery, photo_count: photoCount })
  galleriesByUser.set(gallery.user_id, list)
}

const results = []

for (const user of users ?? []) {
  const qualifyingGalleries = galleriesByUser.get(user.id) ?? []
  if (qualifyingGalleries.length < 2) continue

  const totalPhotos = qualifyingGalleries.reduce((sum, g) => sum + g.photo_count, 0)
  const studioPath = getStudioPath(user.slug, user.studio_name)

  results.push({
    studio_name: user.studio_name || user.name || '(ללא שם)',
    slug: user.slug,
    email: user.email,
    qualifying_galleries: qualifyingGalleries.length,
    total_photos: totalPhotos,
    studio_url: studioPath ? `${appUrl}${studioPath}` : null,
    galleries: qualifyingGalleries
      .sort((a, b) => b.photo_count - a.photo_count)
      .map((g) => ({
        title: g.title,
        slug: g.slug,
        type: g.gallery_type,
        photos: g.photo_count,
        url: `${appUrl}${getGalleryPath(g)}`,
      })),
  })
}

results.sort((a, b) => {
  if (b.total_photos !== a.total_photos) return b.total_photos - a.total_photos
  if (b.qualifying_galleries !== a.qualifying_galleries) {
    return b.qualifying_galleries - a.qualifying_galleries
  }
  return (a.studio_name || '').localeCompare(b.studio_name || '', 'he')
})

console.log(JSON.stringify({ count: results.length, studios: results }, null, 2))
