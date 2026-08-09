export type PostsDisplayStyle = 'cards' | 'circles'

export const POSTS_DISPLAY_STYLES = [
  'cards',
  'circles',
] as const satisfies readonly PostsDisplayStyle[]

export function normalizePostsDisplayStyle(
  value: string | null | undefined
): PostsDisplayStyle {
  return value === 'circles' ? 'circles' : 'cards'
}
