'use client'

import Link from 'next/link'
import { galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from './useRevealOnScroll'
import styles from './GalleryGrid.module.css'

export type GalleryGridTheme = 'classic' | 'elegant' | 'modern' | 'dark'

export type GalleryGridItem = {
  id: string
  title: string
  createdAt: string
  previewUrl: string | null
}

export type GalleryGridProps = {
  galleries: GalleryGridItem[]
  theme: GalleryGridTheme
  language: SiteLanguage
  /** Where a gallery card links to — receives the gallery id. */
  hrefForGallery: (galleryId: string) => string
}

// Only the corner radius actually varied by theme in the old renderer
// (GALLERY_RADIUS_BY_THEME in lib/homepage-themes/gallery-html.ts).
const CARD_RADIUS: Record<GalleryGridTheme, string> = {
  elegant: '0px',
  modern: '12px',
  classic: '4px',
  dark: '0px',
}

const MAX_HOMEPAGE_GALLERIES = 4

export function GalleryGrid({ galleries, theme, language, hrefForGallery }: GalleryGridProps) {
  const display = galleries.slice(0, MAX_HOMEPAGE_GALLERIES)
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>()

  if (display.length === 0) return null

  const copy = getSiteChromeCopy(language)
  const arrow = galleryCardArrow(language)
  const dir = language === 'en' ? 'ltr' : 'rtl'

  return (
    <div ref={ref} className={`${styles.grid} ${revealed ? styles.isVisible : ''}`}>
      {display.map((gallery) => {
        const year = new Date(gallery.createdAt).getFullYear()
        return (
          <Link
            key={gallery.id}
            href={hrefForGallery(gallery.id)}
            className={styles.card}
            style={{ borderRadius: CARD_RADIUS[theme] }}
          >
            {gallery.previewUrl ? (
              <div className={styles.cardMedia}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={gallery.title}
                  className={styles.cardImage}
                  src={gallery.previewUrl}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
            ) : null}
            <div className={styles.cardOverlay} aria-hidden="true" />
            <div className={styles.cardContent} dir={dir}>
              <p className={styles.cardLabel}>{copy.gallerySeriesLabel}</p>
              <h3 className={styles.cardTitle}>{gallery.title}</h3>
              <p className={styles.cardSubtitle}>{year}</p>
              <span className={styles.cardCta}>
                <span className={styles.cardArrow}>{arrow}</span> {copy.galleryViewCta}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
