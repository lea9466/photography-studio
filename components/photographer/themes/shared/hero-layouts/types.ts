import type { HeroSettings } from '@/lib/public-site/hero-settings'
import type { SiteLanguage } from '@/lib/site-language'

export type HeroLayoutTheme = 'classic' | 'elegant' | 'modern' | 'dark'

/** Everything a shared hero layout renders from — the same data every theme's own hero already gets. */
export type HeroLayoutProps = {
  settings: HeroSettings
  theme: HeroLayoutTheme
  studioName: string
  photographerName: string
  /** Plain text — rendered as JSX text, React escapes it. */
  aboutText: string | null
  accentColor: string
  desktopImages: string[]
  mobileImages: string[]
  heroVideoUrl?: string | null
  galleryAnchorHref: string
  contactAnchorHref?: string
  language: SiteLanguage
}
