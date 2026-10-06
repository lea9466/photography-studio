import { createAdminClient } from '@/lib/supabase/admin'
import { slugifyStudioName } from '@/lib/onboarding/slugify'

// Mirrors the top-level routes the slug would otherwise shadow.
const RESERVED_SLUGS = new Set([
  'dashboard', 'login', 'register', 'forgot-password', 'reset-password', 'auth',
  'api', 'g', 'portfolio', 'public-gallery', 'manage', 'admin', 'blog',
])

export async function isSlugFree(
  admin: ReturnType<typeof createAdminClient>,
  slug: string,
  userId: string
): Promise<boolean> {
  if (RESERVED_SLUGS.has(slug)) return false

  const [{ data: owner }, { data: redirect }] = await Promise.all([
    admin.from('users').select('id').ilike('slug', slug).neq('id', userId).limit(1),
    admin.from('slug_redirects').select('old_slug').eq('old_slug', slug).limit(1),
  ])
  return !(owner && owner.length > 0) && !(redirect && redirect.length > 0)
}

/** Studio name → first free slug (name, name-2, name-3 …), or null if none. */
export async function findAvailableSlug(
  admin: ReturnType<typeof createAdminClient>,
  studioName: string,
  userId: string
): Promise<string | null> {
  const base = slugifyStudioName(studioName) || 'studio'
  for (let attempt = 1; attempt <= 50; attempt++) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`
    if (await isSlugFree(admin, candidate, userId)) return candidate
  }
  return null
}
