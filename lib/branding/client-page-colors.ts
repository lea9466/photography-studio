/**
 * Colour handling for the client-facing gallery page. The accent is a
 * photographer-supplied string that ends up inside a `style` attribute, so it
 * is validated to a strict hex shape here and never passed through as-is.
 */

/** Same value as the `users.accent_color` column default. */
export const DEFAULT_CLIENT_ACCENT = '#7c3aed'

/** Quick picks in the client-page design tab — muted tones that suit portrait photography. */
export const CLIENT_PAGE_ACCENT_PRESETS = [
  { name: 'בורדו', hex: '#6b2d43' },
  { name: 'ורוד עתיק', hex: '#b87a86' },
  { name: 'חרסית', hex: '#b5654a' },
  { name: 'זהב', hex: '#b8953f' },
  { name: 'ירוק מרווה', hex: '#6f8f78' },
  { name: 'כחול נייבי', hex: '#1f3a5f' },
  { name: 'סגול', hex: '#7c3aed' },
  { name: 'פחם', hex: '#2b2b2b' },
] as const

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

const LIGHT_TEXT = '#ffffff'
const DARK_TEXT = '#171717'

/** Returns a lowercase 6-digit `#rrggbb`, or null when the input isn't a hex colour. */
export function normalizeHexColor(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed || !HEX_PATTERN.test(trimmed)) return null

  const digits = trimmed.slice(1).toLowerCase()
  if (digits.length === 3) {
    return `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`
  }
  return `#${digits}`
}

function channelToLinear(channel: number) {
  const scaled = channel / 255
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex: string) {
  const red = channelToLinear(parseInt(hex.slice(1, 3), 16))
  const green = channelToLinear(parseInt(hex.slice(3, 5), 16))
  const blue = channelToLinear(parseInt(hex.slice(5, 7), 16))
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(a: number, b: number) {
  const [lighter, darker] = a > b ? [a, b] : [b, a]
  return (lighter + 0.05) / (darker + 0.05)
}

/** White or near-black — whichever reads better on top of `backgroundHex` (a normalized hex). */
export function readableTextColor(backgroundHex: string) {
  const background = relativeLuminance(backgroundHex)
  const againstLight = contrastRatio(background, relativeLuminance(LIGHT_TEXT))
  const againstDark = contrastRatio(background, relativeLuminance(DARK_TEXT))
  return againstLight >= againstDark ? LIGHT_TEXT : DARK_TEXT
}

export type ClientPageAccent = {
  /** Validated `#rrggbb` accent. */
  accent: string
  /** Text colour to use on top of the accent. */
  foreground: string
}

/**
 * The first valid colour among `candidates` (in priority order — e.g. the
 * client-page override, then the site accent), else the default, plus the text
 * colour that reads on it.
 */
export function resolveClientPageAccent(
  ...candidates: (string | null | undefined)[]
): ClientPageAccent {
  let accent = DEFAULT_CLIENT_ACCENT
  for (const candidate of candidates) {
    const normalized = normalizeHexColor(candidate)
    if (normalized) {
      accent = normalized
      break
    }
  }
  return { accent, foreground: readableTextColor(accent) }
}
