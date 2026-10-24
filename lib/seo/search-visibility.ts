import { cache } from 'react'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * users.hide_from_search — a studio that asked to stay out of Google while
 * keeping her site live. Enforced in two places: noindex on every public page
 * (app/[slug]/layout.tsx + app/portfolio/[slug]) and exclusion from both
 * sitemaps (app/sitemap.ts). Deliberately NOT via robots.txt: a disallowed
 * page can't be crawled, so Google would never see the noindex and could keep
 * the URL in results.
 *
 * Every read here fails open (= visible) when the column doesn't exist yet,
 * so nothing breaks before the migration is applied.
 */

export const HIDDEN_FROM_SEARCH_ROBOTS: NonNullable<Metadata['robots']> = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false, noimageindex: true },
}

export const isHiddenFromSearch = cache(async function isHiddenFromSearch(
  userId: string
): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from('users')
    .select('hide_from_search')
    .eq('id', userId)
    .maybeSingle()

  if (error) return false
  return Boolean((data as { hide_from_search?: boolean | null } | null)?.hide_from_search)
})

export async function fetchSearchHiddenUserIds(): Promise<Set<string>> {
  const { data, error } = await createAdminClient()
    .from('users')
    .select('id')
    .eq('hide_from_search', true)

  if (error) return new Set()
  return new Set(((data ?? []) as { id: string }[]).map((row) => row.id))
}

export function isMissingHideFromSearchColumn(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? ''
  return error.code === '42703' || error.code === 'PGRST204' || message.includes('hide_from_search')
}
