import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import fs from 'fs'
import path from 'path'
import { createAdminClient } from '../lib/supabase/admin'
import { findPhotographerBySlug } from '../lib/queries/public-photographer'
import { generateHomepageHTML } from '../lib/homepage-themes/generate-homepage-html'

const SLUG = process.argv[2] || 'rivki'
const OUT_DIR =
  process.argv[3] ||
  'C:\\Users\\1\\AppData\\Local\\Temp\\claude\\c--Users-1-Desktop-studio-gallerys\\d57c2b1f-75d9-46d1-a74e-cf163f07728b\\scratchpad'

const THEMES = ['elegant', 'modern', 'classic', 'dark'] as const

async function run() {
  const db = createAdminClient()

  const photographer = await findPhotographerBySlug(SLUG)
  if (!photographer) {
    console.error(`no photographer found for slug "${SLUG}"`)
    process.exit(1)
  }
  const p = photographer as any

  const { data: galleriesRaw } = await db
    .from('galleries')
    .select('id, title, slug, created_at')
    .eq('user_id', p.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(4)

  const galleries = (galleriesRaw ?? []).map((g: any) => ({
    ...g,
    preview_url: null,
    photographer_slug: p.slug,
    photo_pool: null,
  }))

  const { data: packages } = await db
    .from('photography_packages')
    .select('id, name, price_amount, duration_text, includes, sort_order, is_featured')
    .eq('user_id', p.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const { data: testimonials } = await db
    .from('testimonials')
    .select('id, title, content, shoot_type, review_date, created_at, is_featured, sort_order, image_url')
    .eq('user_id', p.id)
    .order('sort_order', { ascending: true })

  const { data: postsRaw } = await db
    .from('posts')
    .select(
      'id, title, subtitle, content, cover_photo_id, created_at, post_photos!post_photos_post_id_fkey(id, preview_url, sort_order)'
    )
    .eq('user_id', p.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const posts = (postsRaw ?? []).map((post: any) => {
    const orderedPhotos = [...(post.post_photos ?? [])].sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    )
    const images = orderedPhotos.map((ph: any) => ph.preview_url).filter(Boolean)
    return {
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      content: post.content,
      date: post.created_at,
      coverUrl: images[0] ?? null,
      images,
    }
  })

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  for (const theme of THEMES) {
    const html = generateHomepageHTML(
      p,
      theme,
      galleries as any,
      (packages ?? []) as any,
      (testimonials ?? []) as any,
      null,
      posts.length,
      '/blog',
      '/portfolio',
      '/',
      posts as any,
      'https://studio-galleries.com',
      0
    )
    const outFile = path.join(OUT_DIR, `homepage-${theme}.html`)
    fs.writeFileSync(outFile, html, 'utf8')
    console.log(`wrote ${outFile} (${html.length} chars)`)
  }
}

void run()
