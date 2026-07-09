export const POSTS_PAGE_TITLE_DEFAULTS: Record<string, string> = {
  elegant: 'יומן',
  modern: 'הבלוג',
  classic: 'הסיפורים שלנו',
  dark: 'בלוג',
}

export function resolvePostsPageTitle(
  theme: string,
  postsPageTitle?: string | null
) {
  const fallback =
    POSTS_PAGE_TITLE_DEFAULTS[theme] ?? POSTS_PAGE_TITLE_DEFAULTS.elegant

  return postsPageTitle?.trim() || fallback
}
