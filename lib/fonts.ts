import { isAllowedFont, isGoogleFont } from '@/constants/fonts'

/** Weight axes used when requesting each allowed Google family. */
const FONT_WEIGHT_QUERY: Record<string, string> = {
  Assistant: 'wght@300;400;500;600;700',
  Heebo: 'wght@300;400;500;700',
  'Frank Ruhl Libre': 'wght@300;400;500;700',
  Alef: 'wght@400;700',
  Rubik: 'wght@400;500;600;700',
}

const SERIF_FONTS = new Set(['Frank Ruhl Libre', 'Georgia', 'Times New Roman'])

/** Explicit stacks for system fonts (no webfont download). */
const SYSTEM_FONT_STACKS: Record<string, string> = {
  Arial: 'Arial, Helvetica, sans-serif',
  Tahoma: 'Tahoma, Geneva, sans-serif',
  Verdana: 'Verdana, Geneva, sans-serif',
  Georgia: 'Georgia, "Times New Roman", Times, serif',
  'Times New Roman': '"Times New Roman", Times, serif',
  'system-ui':
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

function toGoogleFamilyParam(fontName: string): string {
  const family = fontName.replace(/ /g, '+')
  const weights = FONT_WEIGHT_QUERY[fontName] ?? 'wght@400;700'
  return `family=${family}:${weights}`
}

/**
 * Builds a Google Fonts CSS2 URL for the selected heading / about fonts only.
 * System fonts are skipped. Returns null when nothing needs loading.
 */
export function getGoogleFontUrl(
  headingFont: string | null,
  aboutFont: string | null
): string | null {
  const unique = Array.from(
    new Set(
      [headingFont, aboutFont].filter(
        (name): name is string => isAllowedFont(name) && isGoogleFont(name)
      )
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

/** CSS font-family stack for a whitelisted font name. */
export function toCssFontStack(fontName: string): string {
  if (SYSTEM_FONT_STACKS[fontName]) return SYSTEM_FONT_STACKS[fontName]
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
 * Shared look for homepage section titles across every theme:
 * same font (--headline-font), size, and weight.
 */
const SITE_SECTION_TITLE_SELECTOR = `
.elegant-section-heading__title,
.hp-posts-section .elegant-section-heading__title,
.hp-posts-header .elegant-section-heading__title,
.hp-posts-title,
.hp-posts-section .hp-posts-title,
.homepage-gallery-header h2,
.recent-photos-header h2,
.homepage-packages-section__header h2,
.testimonials-section__header h2,
.faq-section__header h2,
.faq-section h2.font-headline,
.faq-section h2.font-headline-md,
section#gallery h2,
section#portfolio h2,
section#recent-photos h2,
section#posts h2,
section#pricing h2,
section#testimonials h2,
section#faq h2,
section#contact h2,
.site-section-title
`

/**
 * Binds headings / nav to --headline-font, and unifies section-title size + weight.
 */
const SECTION_HEADING_FONT_CSS = `
.font-headline,
.font-headline-md,
.font-headline-sm,
.font-display,
.font-display-lg {
  font-family: var(--headline-font) !important;
}
${SITE_SECTION_TITLE_SELECTOR} {
  font-family: var(--headline-font) !important;
  font-size: clamp(1.875rem, 3.5vw, 2.25rem) !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
}
/* About title keeps its large theme-specific size; only the font is brand-controlled */
.about-title,
.about-hollow-title,
.theme-modern .modern-about-content h1 {
  font-family: var(--about-title-font, var(--headline-font)) !important;
}
.modern-section-eyebrow {
  font-family: var(--headline-font) !important;
}
/* Header / nav links + brand text follow the global heading font */
#main-nav a,
.elegant-nav a,
.modern-nav-link,
.classic-nav-link,
.bold-nav-link,
.modern-nav-brand,
.classic-nav-brand,
.bold-nav-brand,
.site-nav-mobile-menu a {
  font-family: var(--headline-font) !important;
}
#main-nav .material-symbols-outlined,
.site-nav-menu-btn .material-symbols-outlined {
  font-family: 'Material Symbols Outlined' !important;
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
