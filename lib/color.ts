/**
 * Matches CSS hex colors in 3/4/6/8-digit form: #RGB, #RGBA, #RRGGBB, #RRGGBBAA.
 * This is the exact set of values an `<input type="color">` (and hand-typed
 * variants of it) can legitimately produce across the app's branding forms.
 */
export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value.trim())
}

/** "#rrggbb" / "#rgb" → "r, g, b" for use inside rgba(). Falls back to the gold accent on bad input. */
export function hexToRgb(hex: string): string {
  const normalized = hex.replace('#', '').trim()
  const value =
    normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized
  const int = Number.parseInt(value, 16)
  if (Number.isNaN(int)) return '184, 149, 63'
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`
}
