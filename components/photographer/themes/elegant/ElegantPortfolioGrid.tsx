'use client'

import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ElegantPortfolioGrid.module.css'

export type ElegantPortfolioPhoto = {
  id: string
  url: string
  galleryId: string
  galleryName: string
  width?: number | null
  height?: number | null
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
  // Scroll-in reveal: low threshold so it starts as the cell peeks in, with
  // a light per-row stagger across the 3 columns. The 0.9s fade/scale itself
  // lives in the .cell rule of the CSS module (quicker than the private
  // gallery grid, components/gallery/ClientPhotoMasonry.tsx).
  const delayMs = (index % 3) * 70
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>({
    threshold: 0.05,
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
        background: ELEGANT_CELL_BG,
        ...(hasRatio ? { aspectRatio: `${width} / ${height}` } : {}),
      }}
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
          width={photo.width}
          height={photo.height}
          onClick={() => onPhotoClick(index)}
        />
      ))}
    </div>
  )
}
