'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ModernPortfolioGrid.module.css'

export type ModernPortfolioPhoto = {
  id: string
  url: string
  galleryId: string
  galleryName: string
}

export type ModernPortfolioGridProps = {
  photos: ModernPortfolioPhoto[]
  pageTitle: string
  language: SiteLanguage
  /** Index within the (already-filtered) `photos` array that was clicked — opens the lightbox at that index. */
  onPhotoClick: (index: number) => void
}

// MASONRY_CELL_STYLE.modern in lib/public-gallery-html.ts: { radius: '0px', bg: '#eae8e5', extra: '' } — identical to classic's.
const MODERN_CELL_BG = '#eae8e5'

function GridCell({
  url,
  alt,
  index,
  onClick,
}: {
  url: string
  alt: string
  index: number
  onClick: () => void
}) {
  // Matches initMasonryReveal's per-cell IntersectionObserver in the old
  // renderer (threshold 0.12, rootMargin '0px 0px -8% 0px', staggered delay
  // = (index % 4) * 90ms) — same as ClassicPortfolioGrid's GridCell.
  const delayMs = (index % 4) * 90
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
    delayMs,
  })

  return (
    <div
      ref={ref}
      className={`${styles.cell} ${revealed ? styles.isVisible : ''}`}
      style={{ background: MODERN_CELL_BG }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" decoding="async" onClick={onClick} />
    </div>
  )
}

export function ModernPortfolioGrid({ photos, pageTitle, language, onPhotoClick }: ModernPortfolioGridProps) {
  if (photos.length === 0) {
    return <p className={styles.empty}>{language === 'en' ? 'No photos to display' : 'אין תמונות להצגה'}</p>
  }

  return (
    <div className={styles.grid}>
      {photos.map((photo, index) => (
        <GridCell
          key={photo.id}
          url={photo.url}
          alt={`${pageTitle} - ${index + 1}`}
          index={index}
          onClick={() => onPhotoClick(index)}
        />
      ))}
    </div>
  )
}
