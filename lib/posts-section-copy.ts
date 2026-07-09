export const POSTS_PAGE_TITLE_DEFAULT = 'בלוג'

export const POSTS_PAGE_TITLE_DEFAULTS: Record<string, string> = {
  elegant: POSTS_PAGE_TITLE_DEFAULT,
  modern: POSTS_PAGE_TITLE_DEFAULT,
  classic: POSTS_PAGE_TITLE_DEFAULT,
  dark: POSTS_PAGE_TITLE_DEFAULT,
}

export function resolvePostsPageTitle(
  theme: string,
  postsPageTitle?: string | null
) {
  const fallback =
    POSTS_PAGE_TITLE_DEFAULTS[theme] ?? POSTS_PAGE_TITLE_DEFAULT

  return postsPageTitle?.trim() || fallback
}
