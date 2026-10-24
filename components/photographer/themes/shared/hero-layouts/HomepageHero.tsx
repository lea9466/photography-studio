'use client'

import type { ReactNode } from 'react'
import type { HeroSettings } from '@/lib/public-site/hero-settings'
import { HeroLayout } from './HeroLayout'
import type { HeroLayoutProps } from './types'
import { useHeroPreviewOverride } from './useHeroPreviewOverride'

type HomepageHeroProps = Omit<HeroLayoutProps, 'settings'> & {
  /** Saved + entitlement-checked settings; null = the theme's own hero. */
  settings: HeroSettings | null
  /** The theme's own hero, rendered when no shared layout applies. */
  themeHero: ReactNode
}

/**
 * The homepage's hero slot: the shared layout the photographer saved, or her
 * theme's own hero — or, inside the dashboard editor's live preview, whatever
 * she's currently trying out.
 */
export function HomepageHero({ settings, themeHero, ...layoutProps }: HomepageHeroProps) {
  const preview = useHeroPreviewOverride()
  const effective = preview ? preview.settings : settings
  return effective ? <HeroLayout {...layoutProps} settings={effective} /> : <>{themeHero}</>
}
