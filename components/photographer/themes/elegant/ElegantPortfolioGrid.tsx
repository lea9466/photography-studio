'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ElegantPortfolioGrid.module.css'

export type ElegantPortfolioPhoto = {
  id: string
  url: string
  galleryId: string
  galleryName: string
}

export type ElegantPortfolioGridProps = {
  photos: ElegantPortfolioPhoto[]
  pageTitle: string
  language: SiteLanguage
  /** Index within the (already-filtered) `photos` array that was clicked — opens the lightbox at that index. */
  onPhotoClick: (index: number) => void
}

// MASONRY_CELL_STYLE.elegant in lib/public-gallery-html.ts: { radius: '0px', bg: '#eae8e5', extra: '' } — same placeholder color as classic/modern, distinct from dark's #1A1A22.
const ELEGANT_CELL_BG = '#eae8e5'

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
  // = (index % 4) * 90ms) — same as Classic/Dark/ModernPortfolioGrid's GridCell.
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
      style={{ background: ELEGANT_CELL_BG }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" decoding="async" onClick={onClick} />
    </div>
  )
}

export function ElegantPortfolioGrid({ photos, pageTitle, language, onPhotoClick }: ElegantPortfolioGridProps) {
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
