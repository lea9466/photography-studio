import { isAllowedFont } from '@/constants/fonts'

/** Weight axes used when requesting each allowed family from Google Fonts. */
const FONT_WEIGHT_QUERY: Record<string, string> = {
  Assistant: 'wght@300;400;500;600;700',
  Heebo: 'wght@300;400;500;700',
  'Frank Ruhl Libre': 'wght@300;400;500;700',
  Alef: 'wght@400;700',
  Rubik: 'wght@400;500;600;700',
}

const SERIF_FONTS = new Set(['Frank Ruhl Libre'])

function toGoogleFamilyParam(fontName: string): string {
  const family = fontName.replace(/ /g, '+')
  const weights = FONT_WEIGHT_QUERY[fontName] ?? 'wght@400;700'
  return `family=${family}:${weights}`
}

/**
 * Builds a Google Fonts CSS2 URL for the selected heading / about fonts only.
 * Invalid or null names are ignored. Returns null when nothing valid is selected.
 */
export function getGoogleFontUrl(
  headingFont: string | null,
  aboutFont: string | null
): string | null {
  const unique = Array.from(
    new Set(
      [headingFont, aboutFont].filter((name): name is string => isAllowedFont(name))
    )
  )

  if (unique.length === 0) return null

  return `https://fonts.googleapis.com/css2?${unique.map(toGoogleFamilyParam).join('&')}&display=swap`
}

/** Same as getGoogleFontUrl, wrapped as a stylesheet <link> tag (empty string when unused). */
export function getGoogleFontLinkTag(
  headingFont: string | null,
  aboutFont: string | null
): string {
  const href = getGoogleFontUrl(headingFont, aboutFont)
  if (!href) return ''
  return `<link href="${href}" rel="stylesheet"/>`
}

/** CSS font-family stack for a whitelisted Google Font name. */
export function toCssFontStack(fontName: string): string {
  if (fontName === 'Heebo') return `'Heebo', sans-serif`
  if (SERIF_FONTS.has(fontName)) return `'${fontName}', serif`
  return `'${fontName}', 'Heebo', sans-serif`
}

function resolveBrandFonts(
  headingFont: string | null | undefined,
  aboutFont: string | null | undefined
) {
  return {
    heading: isAllowedFont(headingFont) ? headingFont : null,
    about: isAllowedFont(aboutFont) ? aboutFont : null,
  }
}

/**
 * Binds section headings to --headline-font so theme defaults and brand
 * overrides both win over hardcoded font-family rules / inline styles.
 */
const SECTION_HEADING_FONT_CSS = `
.elegant-section-heading__title,
.font-headline,
.font-headline-md,
.font-headline-sm,
.font-display,
.font-display-lg,
.hp-posts-title,
.homepage-packages-section__header h2,
.testimonials-section__header h2,
.faq-section__header h2,
.about-hollow-title {
  font-family: var(--headline-font) !important;
}
.about-title {
  font-family: var(--about-title-font, var(--headline-font)) !important;
}
`

/**
 * Late :root override for brand fonts + section-heading binding.
 * Always injects the heading selectors; :root vars only when a font is selected.
 */
export function buildBrandFontVarsStyle(
  headingFont: string | null | undefined,
  aboutFont: string | null | undefined
): string {
  const { heading, about } = resolveBrandFonts(headingFont, aboutFont)
  const vars: string[] = []
  if (heading) vars.push(`--headline-font: ${toCssFontStack(heading)};`)
  if (about) vars.push(`--about-title-font: ${toCssFontStack(about)};`)
  const root = vars.length > 0 ? `:root { ${vars.join(' ')} }` : ''
  return `<style id="brand-font-vars">${root}${SECTION_HEADING_FONT_CSS}</style>`
}

/**
 * Link + :root override for brand fonts.
 * Prefer injecting the style after each theme's :root so overrides win.
 */
export function buildBrandFontHeadHtml(
  headingFont: string | null | undefined,
  aboutFont: string | null | undefined
): string {
  const { heading, about } = resolveBrandFonts(headingFont, aboutFont)
  return [getGoogleFontLinkTag(heading, about), buildBrandFontVarsStyle(heading, about)]
    .filter(Boolean)
    .join('\n')
}
