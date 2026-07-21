export type AllowedFontSource = 'google' | 'system'

export type AllowedFont = {
  name: string
  value: string
  /** google = load from Google Fonts; system = built into OS/browsers */
  source: AllowedFontSource
}

export const ALLOWED_FONTS: AllowedFont[] = [
  // Google Fonts (Hebrew)
  { name: 'Assistant', value: 'Assistant', source: 'google' },
  { name: 'Heebo', value: 'Heebo', source: 'google' },
  { name: 'Frank Ruhl Libre', value: 'Frank Ruhl Libre', source: 'google' },
  { name: 'Alef', value: 'Alef', source: 'google' },
  { name: 'Rubik', value: 'Rubik', source: 'google' },
  // System / web-safe (available without loading a webfont)
  { name: 'Arial', value: 'Arial', source: 'system' },
  { name: 'Tahoma', value: 'Tahoma', source: 'system' },
  { name: 'Verdana', value: 'Verdana', source: 'system' },
  { name: 'Georgia', value: 'Georgia', source: 'system' },
  { name: 'Times New Roman', value: 'Times New Roman', source: 'system' },
  { name: 'System UI', value: 'system-ui', source: 'system' },
]

export const DEFAULT_HEADING_FONT = 'Frank Ruhl Libre'
export const DEFAULT_ABOUT_TITLE_FONT = 'Rubik'

/** Google Fonts stylesheet for dashboard previews (google sources only). */
export const ALLOWED_FONTS_STYLESHEET_HREF =
  'https://fonts.googleapis.com/css2?family=Alef:wght@400;700&family=Assistant:wght@300;400;500;600;700&family=Frank+Ruhl+Libre:wght@300;400;500;700&family=Heebo:wght@300;400;500;700&family=Rubik:wght@400;500;600;700&display=swap'

const ALLOWED_FONT_BY_VALUE = new Map(ALLOWED_FONTS.map((font) => [font.value, font]))

/** Returns true when the name is in the allowed fonts whitelist. */
export function isAllowedFont(fontName: string | null | undefined): fontName is string {
  if (!fontName) return false
  return ALLOWED_FONT_BY_VALUE.has(fontName)
}

export function getAllowedFont(fontName: string | null | undefined): AllowedFont | undefined {
  if (!fontName) return undefined
  return ALLOWED_FONT_BY_VALUE.get(fontName)
}

export function isGoogleFont(fontName: string | null | undefined): boolean {
  return getAllowedFont(fontName)?.source === 'google'
}

export function isSystemFont(fontName: string | null | undefined): boolean {
  return getAllowedFont(fontName)?.source === 'system'
}

/** Returns a whitelisted font, or the provided fallback when missing/invalid. */
export function resolveAllowedFont(
  fontName: string | null | undefined,
  fallback: string
): string {
  return isAllowedFont(fontName) ? fontName : fallback
}
