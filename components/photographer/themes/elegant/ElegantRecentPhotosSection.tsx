import Link from 'next/link'
import { galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import { RecentPhotosGrid, type RecentPhotosGridItem } from '../shared/RecentPhotosGrid'
import { ElegantSectionHeading } from './ElegantSectionHeading'
import styles from './ElegantRecentPhotosSection.module.css'

export type ElegantRecentPhotosSectionProps = {
  title: string
  galleries: RecentPhotosGridItem[]
  accentColor: string
  language: SiteLanguage
  /** "View all photos" link — only rendered in "portfolio" gallery layout mode. */
  portfolioHref?: string | null
}

/**
 * Elegant theme's homepage "Latest" recent-photos section — base layout port
 * of the `id="recent-photos"` block in lib/homepage-themes/elegant.ts (line
 * ~1169).
 *
 * The header is flush-left (`align="start"`), matching
 * ElegantGalleriesSection's own flush-left treatment — this is a DELIBERATE
 * deviation from the real source, which docks this section's header
 * right/RTL-natural instead (`.recent-photos-header .elegant-section-heading
 * { justify-items: end; text-align: right }`, RECENT_PHOTOS_GRID_CSS). Lea
 * explicitly asked for "LATEST" to be left-aligned like Collections, not for
 * source fidelity here (2026-08-24).
 */
export function ElegantRecentPhotosSection({
  title,
  galleries,
  accentColor,
  language,
  portfolioHref,
}: ElegantRecentPhotosSectionProps) {
  // Matches the old renderer: the whole section only exists once at least
  // one gallery actually has photos.
  const hasPhotos = galleries.some((g) => (g.photoPool?.length ?? 0) > 0)
  if (!hasPhotos) return null

  const copy = getSiteChromeCopy(language)
  const arrow = galleryCardArrow(language)

  return (
    <section id="recent-photos" className={styles.section}>
      <div className={styles.header}>
        <div className={`${styles.headerInner} ${portfolioHref ? styles.headerInnerWithCta : ''}`}>
          <ElegantSectionHeading title={title} watermark="LATEST" accentColor={accentColor} align="start" />
          {portfolioHref ? (
            <div className={styles.more}>
              <Link href={portfolioHref} className={styles.moreLink} style={{ color: accentColor }}>
                {copy.viewAllPhotos}
                <span className={styles.moreArrow} aria-hidden="true">
                  {arrow}
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      <RecentPhotosGrid galleries={galleries} theme="elegant" />
    </section>
  )
}
