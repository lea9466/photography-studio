/**
 * Light/dark page background for the client-facing gallery page — a
 * studio-wide choice, saved on `users.client_page_background`. Maps onto the
 * same theme CSS variables the public site's "Bold" theme already uses (see
 * `[data-theme='bold']` in app/globals.css) — no new CSS, just which of the
 * two existing looks the client page renders with.
 */
export const CLIENT_PAGE_BACKGROUNDS = ['light', 'dark'] as const

export type ClientPageBackground = (typeof CLIENT_PAGE_BACKGROUNDS)[number]

export const DEFAULT_CLIENT_PAGE_BACKGROUND: ClientPageBackground = 'light'

export const CLIENT_PAGE_BACKGROUND_LABELS: Record<ClientPageBackground, { name: string; swatch: string }> = {
  light: { name: 'בהיר', swatch: '#fafafa' },
  dark: { name: 'כהה', swatch: '#1c1917' },
}

export function isClientPageBackground(value: unknown): value is ClientPageBackground {
  return typeof value === 'string' && (CLIENT_PAGE_BACKGROUNDS as readonly string[]).includes(value)
}

/** A saved value, or the default when it's null/invalid. */
export function resolveClientPageBackground(value: string | null | undefined): ClientPageBackground {
  return isClientPageBackground(value) ? value : DEFAULT_CLIENT_PAGE_BACKGROUND
}

/** The `data-theme` attribute value that renders a given background — reuses the public site's theme CSS. */
export function clientPageDataTheme(background: ClientPageBackground): 'classic' | 'bold' {
  return background === 'dark' ? 'bold' : 'classic'
}
