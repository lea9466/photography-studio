import type { SiteLanguage } from '@/lib/site-language'

export const POSTS_PAGE_TITLE_DEFAULT = 'בלוג'

export const POSTS_PAGE_TITLE_DEFAULTS: Record<string, string> = {
  elegant: POSTS_PAGE_TITLE_DEFAULT,
  modern: POSTS_PAGE_TITLE_DEFAULT,
  classic: POSTS_PAGE_TITLE_DEFAULT,
  dark: POSTS_PAGE_TITLE_DEFAULT,
}

export const POSTS_PAGE_TITLE_DEFAULTS_EN: Record<string, string> = {
  elegant: 'Blog',
  modern: 'Blog',
  classic: 'Blog',
  dark: 'Journal',
}

export function resolvePostsPageTitle(
  theme: string,
  postsPageTitle?: string | null,
  language: SiteLanguage = 'he',
) {
  const defaults =
    language === 'en' ? POSTS_PAGE_TITLE_DEFAULTS_EN : POSTS_PAGE_TITLE_DEFAULTS
  const fallback = defaults[theme] ?? POSTS_PAGE_TITLE_DEFAULT

  return postsPageTitle?.trim() || fallback
}
