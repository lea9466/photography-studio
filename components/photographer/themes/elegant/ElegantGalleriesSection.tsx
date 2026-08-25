import type { SiteLanguage } from '@/lib/site-language'
import { GalleryGrid, type GalleryGridItem } from '../shared/GalleryGrid'
import { ElegantSectionHeading } from './ElegantSectionHeading'
import styles from './ElegantGalleriesSection.module.css'

export type ElegantGalleriesSectionProps = {
  title: string
  galleries: GalleryGridItem[]
  accentColor: string
  language: SiteLanguage
  hrefForGallery: (galleryId: string) => string
}

/**
 * Elegant theme's homepage "Collections" galleries section — 1:1 port of the
 * `id="gallery"` block in lib/homepage-themes/elegant.ts (line ~1145).
 *
 * The header is flush-left/LTR-container via elegant.ts's own late override
 * ("Elegant galleries title: flush left with gallery grid" —
 * `.theme-elegant .homepage-gallery-header*`), which beats
 * UNIFIED_GALLERY_GRID_CSS's generic RTL-right default. That's why this
 * section builds its own header markup (ElegantSectionHeading with
 * `align="start"`) instead of the shared/GallerySectionHeader used by
 * classic (whose header genuinely stays RTL-right).
 */
export function ElegantGalleriesSection({
  title,
  galleries,
  accentColor,
  language,
  hrefForGallery,
}: ElegantGalleriesSectionProps) {
  // Matches the old renderer: the whole section only exists once there's
  // something to show (generateUnifiedGalleryGridHTML returns '' otherwise).
  if (galleries.length === 0) return null

  return (
    <section id="gallery" className={`${styles.section} py-24 bg-white`}>
      <div className={styles.header}>
        <ElegantSectionHeading title={title} watermark="COLLECTIONS" accentColor={accentColor} align="start" />
      </div>
      <GalleryGrid galleries={galleries} theme="elegant" language={language} hrefForGallery={hrefForGallery} />
    </section>
  )
}
