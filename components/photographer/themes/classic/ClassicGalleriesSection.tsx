import type { SiteLanguage } from '@/lib/site-language'
import { GalleryGrid, type GalleryGridItem } from '../shared/GalleryGrid'
import { GallerySectionHeader } from '../shared/GallerySectionHeader'
import { SectionTitle } from '../shared/SectionTitle'
import { ClassicSectionScript } from './ClassicSectionScript'
import styles from './ClassicGalleriesSection.module.css'

export type ClassicGalleriesSectionProps = {
  title: string
  galleries: GalleryGridItem[]
  accentColor: string
  language: SiteLanguage
  hrefForGallery: (galleryId: string) => string
}

export function ClassicGalleriesSection({
  title,
  galleries,
  accentColor,
  language,
  hrefForGallery,
}: ClassicGalleriesSectionProps) {
  // Matches the old renderer: the whole section only exists once there's
  // something to show (generateUnifiedGalleryGridHTML returns '' otherwise).
  if (galleries.length === 0) return null

  return (
    <section id="galleries" className={styles.section}>
      <GallerySectionHeader>
        <ClassicSectionScript color={accentColor}>Collections</ClassicSectionScript>
        <SectionTitle color="#2d2825">{title}</SectionTitle>
      </GallerySectionHeader>
      <GalleryGrid galleries={galleries} theme="classic" language={language} hrefForGallery={hrefForGallery} />
    </section>
  )
}
