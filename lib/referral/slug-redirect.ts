import { createAdminClient } from '@/lib/supabase/admin'

const RESERVED_SLUGS = new Set([
  'dashboard',
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'auth',
  'api',
  'g',
  'portfolio',
  'public-gallery',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

export function parseStudioSlugPath(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)\/?$/)
  if (!match) return null

  const segment = decodeURIComponent(match[1]).trim()
  if (!segment || RESERVED_SLUGS.has(segment.toLowerCase())) return null

  return segment
}

export async function resolveSlugRedirect(oldSlug: string): Promise<string | null> {
  const slug = oldSlug.trim()
  if (!slug) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('slug_redirects')
    .select('new_slug')
    .eq('old_slug', slug)
    .maybeSingle()

  return (data as { new_slug: string } | null)?.new_slug ?? null
}

export async function recordSlugRedirect(oldSlug: string, newSlug: string) {
  const oldValue = oldSlug.trim()
  const newValue = newSlug.trim()

  if (!oldValue || !newValue || oldValue === newValue) return

  const admin = createAdminClient()
  await admin.from('slug_redirects').upsert(
    { old_slug: oldValue, new_slug: newValue } as never,
    { onConflict: 'old_slug' }
  )
}
