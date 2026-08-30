'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './DarkPortfolioGrid.module.css'

export type DarkPortfolioPhoto = {
  id: string
  url: string
  galleryId: string
  galleryName: string
  width?: number | null
  height?: number | null
}

export type DarkPortfolioGridProps = {
  photos: DarkPortfolioPhoto[]
  pageTitle: string
  language: SiteLanguage
  /** Index within the (already-filtered) `photos` array that was clicked — opens the lightbox at that index. */
  onPhotoClick: (index: number) => void
}

// MASONRY_CELL_STYLE.dark in lib/public-gallery-html.ts: { radius: '0px', bg: '#1A1A22', extra: '' } — dark's own placeholder color, distinct from classic/modern's #eae8e5.
const DARK_CELL_BG = '#1A1A22'

function GridCell({
  url,
  alt,
  index,
  width,
  height,
  onClick,
}: {
  url: string
  alt: string
  index: number
  width?: number | null
  height?: number | null
  onClick: () => void
}) {
  // Matches initMasonryReveal's per-cell IntersectionObserver in the old
  // renderer (threshold 0.12, rootMargin '0px 0px -8% 0px', staggered delay
  // = (index % 4) * 90ms) — same as Classic/ModernPortfolioGrid's GridCell.
  const delayMs = (index % 4) * 90
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
    delayMs,
  })

  // Reserve the cell's box from the photo's real dimensions so the
  // CSS-columns masonry settles into its final shape on first paint instead
  // of re-balancing every column as each image streams in.
  const hasRatio = Boolean(width && height)

  return (
    <div
      ref={ref}
      className={`${styles.cell} ${hasRatio ? styles.sized : ''} ${revealed ? styles.isVisible : ''}`}
      style={{
        background: DARK_CELL_BG,
        ...(hasRatio ? { aspectRatio: `${width} / ${height}` } : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" decoding="async" onClick={onClick} />
    </div>
  )
}

export function DarkPortfolioGrid({ photos, pageTitle, language, onPhotoClick }: DarkPortfolioGridProps) {
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
          width={photo.width}
          height={photo.height}
          onClick={() => onPhotoClick(index)}
        />
      ))}
    </div>
  )
}
