import Link from 'next/link'
import { galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import { RecentPhotosGrid, type RecentPhotosGridItem } from '../shared/RecentPhotosGrid'
import { DarkSectionEyebrow } from './DarkSectionEyebrow'
import styles from './DarkRecentPhotosSection.module.css'

export type DarkRecentPhotosSectionProps = {
  title: string
  galleries: RecentPhotosGridItem[]
  accentColor: string
  language: SiteLanguage
  /** "View all photos" link — only rendered in "portfolio" gallery layout mode. */
  portfolioHref?: string | null
}

/**
 * Dark theme's homepage "Latest" recent-photos section — 1:1 port of the
 * `id="recent-photos"` block in lib/homepage-themes/dark.ts (line ~1397).
 *
 * Same LTR-header override reasoning as DarkGalleriesSection applies here —
 * dark.ts's `.theme-bold .recent-photos-header, .theme-bold
 * .recent-photos-header > div { text-align: left !important; align-items:
 * flex-start !important; direction: ltr }` plus the with-CTA variant
 * (`flex-direction: row !important` — non-reversed, since the container is
 * already LTR) beat the generic RTL rules from RECENT_PHOTOS_GRID_CSS. No
 * divider element in the source markup — just eyebrow + title (+ the CTA
 * link when present).
 */
export function DarkRecentPhotosSection({
  title,
  galleries,
  accentColor,
  language,
  portfolioHref,
}: DarkRecentPhotosSectionProps) {
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
          <div className={styles.titles}>
            <DarkSectionEyebrow accentColor={accentColor}>LATEST</DarkSectionEyebrow>
            <h2 className={styles.title}>{title}</h2>
          </div>
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
      <RecentPhotosGrid galleries={galleries} theme="dark" />
    </section>
  )
}
