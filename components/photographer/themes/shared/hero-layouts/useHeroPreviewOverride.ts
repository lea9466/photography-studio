'use client'

import { useEffect, useState } from 'react'
import { normalizeHeroSettings, type HeroSettings } from '@/lib/public-site/hero-settings'
import {
  HERO_PREVIEW_QUERY_PARAM,
  HERO_PREVIEW_READY_MESSAGE,
  HERO_PREVIEW_SETTINGS_MESSAGE,
} from '@/lib/public-site/hero-preview'

/**
 * Inside the dashboard hero editor's iframe (`?heroPreview=1`), the unsaved
 * hero settings the editor posts — `{ settings: null }` meaning "the theme's
 * own hero". Everywhere else, always null (no override).
 *
 * Only messages from the parent window on this same origin are accepted, so
 * no other page can drive what a visitor sees; and it's display-only — the
 * saved settings are never touched.
 */
export function useHeroPreviewOverride(): { settings: HeroSettings | null } | null {
  const [override, setOverride] = useState<{ settings: HeroSettings | null } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get(HERO_PREVIEW_QUERY_PARAM) !== '1' || window.parent === window) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      const data = event.data as { type?: unknown; settings?: unknown } | null
      if (!data || data.type !== HERO_PREVIEW_SETTINGS_MESSAGE) return
      setOverride({ settings: data.settings === null ? null : normalizeHeroSettings(data.settings) })
    }

    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: HERO_PREVIEW_READY_MESSAGE }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return override
}
