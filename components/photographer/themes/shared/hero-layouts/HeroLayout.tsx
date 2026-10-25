import type { ComponentType } from 'react'
import type { HeroLayoutId } from '@/lib/public-site/hero-settings'
import { ArchHeroLayout } from './ArchHeroLayout'
import { CinemaHeroLayout } from './CinemaHeroLayout'
import { FilmHeroLayout } from './FilmHeroLayout'
import { FrameHeroLayout } from './FrameHeroLayout'
import { MagHeroLayout } from './MagHeroLayout'
import { PanoHeroLayout } from './PanoHeroLayout'
import { SplitHeroLayout } from './SplitHeroLayout'
import { StampHeroLayout } from './StampHeroLayout'
import { TrioHeroLayout } from './TrioHeroLayout'
import type { HeroLayoutProps } from './types'

const LAYOUTS: Record<HeroLayoutId, ComponentType<HeroLayoutProps>> = {
  cinema: CinemaHeroLayout,
  split: SplitHeroLayout,
  frame: FrameHeroLayout,
  arch: ArchHeroLayout,
  trio: TrioHeroLayout,
  mag: MagHeroLayout,
  film: FilmHeroLayout,
  pano: PanoHeroLayout,
  stamp: StampHeroLayout,
}

/** The shared hero layout the photographer picked, styled by her theme's tokens. */
export function HeroLayout(props: HeroLayoutProps) {
  const Layout = LAYOUTS[props.settings.layout]
  return <Layout {...props} />
}

export type { HeroLayoutProps, HeroLayoutTheme } from './types'
