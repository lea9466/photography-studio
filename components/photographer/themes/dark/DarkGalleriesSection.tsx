import type { SiteLanguage } from '@/lib/site-language'
import { GalleryGrid, type GalleryGridItem } from '../shared/GalleryGrid'
import { DarkSectionEyebrow } from './DarkSectionEyebrow'
import styles from './DarkGalleriesSection.module.css'

export type DarkGalleriesSectionProps = {
  title: string
  galleries: GalleryGridItem[]
  accentColor: string
  language: SiteLanguage
  hrefForGallery: (galleryId: string) => string
}

/**
 * Dark theme's homepage "Collections" galleries section — 1:1 port of the
 * `id="gallery"` block in lib/homepage-themes/dark.ts (line ~1371).
 *
 * Unlike classic (whose gallery header stays RTL/right-aligned — the generic
 * `.homepage-gallery-header` layout from UNIFIED_GALLERY_GRID_CSS, never
 * overridden by classic), dark.ts adds its own late override:
 * `.theme-bold .homepage-gallery-header, .theme-bold .homepage-gallery-header > div
 * { text-align: left !important; align-items: flex-start !important; direction: ltr; }`
 * (higher specificity than the mobile RTL fallback at `.homepage-gallery-header
 * { text-align: right !important }`, so it wins at every viewport width) — so
 * dark's header is genuinely LTR/left-aligned, matching `boldSectionEyebrow`'s
 * default `align: 'left'` for this section (no explicit align opt passed for
 * 'COLLECTIONS', unlike 'ABOUT' which explicitly passes `align: 'right'`).
 * That's why this section builds its own header markup instead of reusing
 * `shared/GallerySectionHeader` (which is genuinely RTL-right and correct for
 * classic, but wrong for dark).
 *
 * No divider element in the source markup here — just eyebrow + title.
 */
export function DarkGalleriesSection({
  title,
  galleries,
  accentColor,
  language,
  hrefForGallery,
}: DarkGalleriesSectionProps) {
  // Matches the old renderer: the whole section only exists once there's
  // something to show (generateUnifiedGalleryGridHTML returns '' otherwise).
  if (galleries.length === 0) return null

  return (
    <section id="gallery" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <DarkSectionEyebrow accentColor={accentColor}>COLLECTIONS</DarkSectionEyebrow>
          <h2 className={styles.title}>{title}</h2>
        </div>
      </div>
      <GalleryGrid galleries={galleries} theme="dark" language={language} hrefForGallery={hrefForGallery} />
    </section>
  )
}
