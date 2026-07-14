/**
 * Matches CSS hex colors in 3/4/6/8-digit form: #RGB, #RGBA, #RRGGBB, #RRGGBBAA.
 * This is the exact set of values an `<input type="color">` (and hand-typed
 * variants of it) can legitimately produce across the app's branding forms.
 */
export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value.trim())
}
