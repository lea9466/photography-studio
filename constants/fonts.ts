export type AllowedFont = {
  name: string
  value: string
}

export const ALLOWED_FONTS: AllowedFont[] = [
  { name: 'Assistant', value: 'Assistant' },
  { name: 'Heebo', value: 'Heebo' },
  { name: 'Frank Ruhl Libre', value: 'Frank Ruhl Libre' },
  { name: 'Alef', value: 'Alef' },
  { name: 'Rubik', value: 'Rubik' },
]

export const DEFAULT_HEADING_FONT = 'Frank Ruhl Libre'
export const DEFAULT_ABOUT_TITLE_FONT = 'Rubik'

/** Google Fonts stylesheet covering every entry in ALLOWED_FONTS (for dashboard previews). */
export const ALLOWED_FONTS_STYLESHEET_HREF =
  'https://fonts.googleapis.com/css2?family=Alef:wght@400;700&family=Assistant:wght@300;400;500;600;700&family=Frank+Ruhl+Libre:wght@300;400;500;700&family=Heebo:wght@300;400;500;700&family=Rubik:wght@400;500;600;700&display=swap'

const ALLOWED_FONT_VALUES = new Set(ALLOWED_FONTS.map((font) => font.value))

/** Returns true when the name is in the allowed Google Fonts whitelist. */
export function isAllowedFont(fontName: string | null | undefined): fontName is string {
  if (!fontName) return false
  return ALLOWED_FONT_VALUES.has(fontName)
}

/** Returns a whitelisted font, or the provided fallback when missing/invalid. */
export function resolveAllowedFont(
  fontName: string | null | undefined,
  fallback: string
): string {
  return isAllowedFont(fontName) ? fontName : fallback
}
