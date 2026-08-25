'use client'

import { useRevealOnScroll } from './useRevealOnScroll'
import styles from './RecentPhotosGrid.module.css'

export type RecentPhotosGridTheme = 'classic' | 'elegant' | 'modern' | 'dark'

export type RecentPhotosGridItem = {
  id: string
  title: string
  photoPool: string[] | null
}

export type RecentPhotosGridProps = {
  galleries: RecentPhotosGridItem[]
  theme: RecentPhotosGridTheme
}

const MAX_ROWS = 4
const PHOTOS_PER_ROW = 4

// Only the corner radius actually varied by theme in the old renderer
// (.recent-photos-grid--<theme> .recent-photo-cell in RECENT_PHOTOS_GRID_CSS,
// lib/homepage-themes/shared-styles.ts) — same values as GALLERY_RADIUS_BY_THEME
// in lib/homepage-themes/gallery-html.ts, and the same per-card inline-style
// approach GalleryGrid.tsx already uses instead of porting modifier classes.
const CELL_RADIUS: Record<RecentPhotosGridTheme, string> = {
  elegant: '0px',
  modern: '12px',
  classic: '4px',
  dark: '0px',
}

/** 1:1 port of pickRowPhotos in lib/homepage-themes/gallery-html.ts. */
function pickRowPhotos(pool: string[], offset: number, count: number): string[] {
  if (pool.length === 0) return []
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(pool[(offset + i) % pool.length])
  }
  return result
}

type Cell = { key: string; src: string; title: string; delay: number }

/**
 * One photo tile. Fades/scales in on its own IntersectionObserver, delayed
 * per-cell — the React port of RECENT_PHOTOS_REVEAL_SCRIPT (which observes
 * every `.recent-photo-cell` individually and setTimeouts the `is-visible`
 * class by its `data-reveal-delay`).
 */
function RecentPhotoCell({ src, title, delay, radius }: { src: string; title: string; delay: number; radius: string }) {
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: '0px 0px -8% 0px',
    delayMs: delay,
  })

  return (
    <div
      ref={ref}
      className={`${styles.cell} ${revealed ? styles.isVisible : ''}`}
      style={{ borderRadius: radius }}
      aria-label={title}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={title} className={styles.img} src={src} loading="lazy" decoding="async" fetchPriority="low" />
    </div>
  )
}

/**
 * Recent-photos grid — 1:1 port of generateRecentPhotosGridHTML
 * (lib/homepage-themes/gallery-html.ts). Genuinely shared across all 4
 * themes: the photo-picking logic is identical, and the only thing that
 * varies per theme is the cell corner radius, same pattern as the existing
 * shared GalleryGrid component.
 *
 * Note: old markup deliberately dropped per-cell links ("Remove link
 * functionality for performance - images display faster without links") —
 * preserved here, cells are non-interactive divs, not anchors.
 */
export function RecentPhotosGrid({ galleries, theme }: RecentPhotosGridProps) {
  const withPhotos = galleries.filter((g) => (g.photoPool?.length ?? 0) > 0)
  if (withPhotos.length === 0) return null

  const rows = withPhotos.slice(0, MAX_ROWS)
  const radius = CELL_RADIUS[theme]

  let cellIndex = 0
  const cells: Cell[] = []
  for (const gallery of rows) {
    const pool = gallery.photoPool ?? []
    const photos = pickRowPhotos(pool, 0, PHOTOS_PER_ROW)
    for (const src of photos) {
      const delay = (cellIndex % 4) * 90
      cells.push({ key: `${gallery.id}-${cellIndex}`, src, title: gallery.title, delay })
      cellIndex++
    }
  }

  return (
    <div className={styles.grid}>
      {cells.map((cell) => (
        <RecentPhotoCell key={cell.key} src={cell.src} title={cell.title} delay={cell.delay} radius={radius} />
      ))}
    </div>
  )
}
