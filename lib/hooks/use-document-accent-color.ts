'use client'

import { useEffect } from 'react'

export const A11Y_ACCENT_CSS_VAR = '--a11y-accent'

/**
 * Publishes a studio's brand accent color onto <html> so the shared
 * AccessibilityWidget — a sibling of {children} in the root layout, not a
 * descendant of this page's own tree (see app/layout.tsx) — can pick it up
 * via var(--a11y-accent, <fallback>). Mirrors the lang/dir pattern every
 * *PageChrome already uses for the same "reach past {children} up to
 * <html>" problem — see ClassicPageChrome's doc comment for why that's a
 * client effect instead of a real attribute.
 *
 * Only the public-site chromes call this; nothing sets the var anywhere
 * else (dashboard, marketing, auth), so the widget's own var(..., #7c3aed)
 * fallback is what keeps it unchanged there.
 */
export function useDocumentAccentColor(color: string) {
  useEffect(() => {
    document.documentElement.style.setProperty(A11Y_ACCENT_CSS_VAR, color)
    return () => {
      document.documentElement.style.removeProperty(A11Y_ACCENT_CSS_VAR)
    }
  }, [color])
}
