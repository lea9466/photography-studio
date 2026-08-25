/**
 * React port of `brandLastWord()` (lib/homepage-themes/text-helpers.ts /
 * lib/photographer-site-chrome.ts): renders plain text with only its last
 * word colored in the studio's accent — used for the studio name wherever
 * dark falls back to text instead of a logo (hero title, nav brand, footer
 * brand). Built as text nodes instead of an HTML string, so no markup
 * injection is needed.
 *
 * The old renderer expressed this as `class="text-primary font-light"` —
 * `text-primary` only resolved because each theme injected its own runtime
 * `tailwind.config` with `colors.primary` set to the studio's accent color
 * (not a key in this app's real build-time Tailwind), so the color is
 * applied inline here instead. `font-light` (weight 300) is overridden to
 * 800 specifically in the hero's own CSS
 * (`.bold-hero-title .text-primary, .bold-hero-title .font-light`) — the nav
 * brand and footer brand have no such override, so they stay at the
 * genuine Tailwind `font-light` weight (300). Callers pass `bold` to match
 * the hero's context.
 */
export function DarkBrandLastWord({
  text,
  accentColor,
  bold = false,
}: {
  text: string
  accentColor: string
  bold?: boolean
}) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const words = trimmed.split(/\s+/)
  const style = { color: accentColor, fontWeight: bold ? 800 : 300 }
  if (words.length === 1) {
    return <span style={style}>{trimmed}</span>
  }
  const lastWord = words.pop()
  return (
    <>
      {words.join(' ')} <span style={style}>{lastWord}</span>
    </>
  )
}
