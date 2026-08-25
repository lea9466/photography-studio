import type { SiteLanguage } from '@/lib/site-language'
import { GalleryGrid, type GalleryGridItem } from '../shared/GalleryGrid'
import { SectionTitle } from '../shared/SectionTitle'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import styles from './ModernGalleriesSection.module.css'

export type ModernGalleriesSectionProps = {
  title: string
  galleries: GalleryGridItem[]
  accentColor: string
  language: SiteLanguage
  hrefForGallery: (galleryId: string) => string
}

export function ModernGalleriesSection({
  title,
  galleries,
  accentColor,
  language,
  hrefForGallery,
}: ModernGalleriesSectionProps) {
  // Matches the old renderer: the whole section only exists once there's
  // something to show (generateUnifiedGalleryGridHTML returns '' otherwise).
  if (galleries.length === 0) return null

  return (
    <section id="portfolio" className={styles.section}>
      <div className={styles.header} style={{ '--modern-accent': accentColor } as React.CSSProperties}>
        <ModernSectionEyebrow>COLLECTIONS</ModernSectionEyebrow>
        <SectionTitle color="#0f172a" className={styles.title}>
          {title}
        </SectionTitle>
      </div>
      <GalleryGrid galleries={galleries} theme="modern" language={language} hrefForGallery={hrefForGallery} />
    </section>
  )
}
