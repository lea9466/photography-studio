export type BeforeAfterDisplayStyle = 'development' | 'split_slider'

export const BEFORE_AFTER_DISPLAY_STYLES = [
  'development',
  'split_slider',
] as const satisfies readonly BeforeAfterDisplayStyle[]

export function normalizeBeforeAfterDisplayStyle(
  value: string | null | undefined
): BeforeAfterDisplayStyle {
  return value === 'split_slider' ? 'split_slider' : 'development'
}
