import Link from 'next/link'
import { galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import { RecentPhotosGrid, type RecentPhotosGridItem } from '../shared/RecentPhotosGrid'
import { SectionTitle } from '../shared/SectionTitle'
import { ClassicSectionScript } from './ClassicSectionScript'
import styles from './ClassicRecentPhotosSection.module.css'

export type ClassicRecentPhotosSectionProps = {
  title: string
  galleries: RecentPhotosGridItem[]
  accentColor: string
  language: SiteLanguage
  /**
   * "View all photos" link — only rendered in "portfolio" gallery layout
   * mode (see portfolioCtaHtml in lib/homepage-themes/generate-homepage-html.ts,
   * which is only truthy when isPortfolioMode && portfolioPath && at least
   * one gallery has photos).
   */
  portfolioHref?: string | null
}

export function ClassicRecentPhotosSection({
  title,
  galleries,
  accentColor,
  language,
  portfolioHref,
}: ClassicRecentPhotosSectionProps) {
  // Matches the old renderer: the whole section only exists once at least
  // one gallery actually has photos (generateRecentPhotosGridHTML's guard).
  const hasPhotos = galleries.some((g) => (g.photoPool?.length ?? 0) > 0)
  if (!hasPhotos) return null

  const copy = getSiteChromeCopy(language)
  const arrow = galleryCardArrow(language)

  return (
    <section id="recent-photos" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.titles}>
            <ClassicSectionScript color={accentColor}>Latest</ClassicSectionScript>
            <SectionTitle color="#1c1917" className={styles.title}>
              {title}
            </SectionTitle>
            <div className={styles.divider} style={{ background: accentColor }} aria-hidden="true" />
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
      <RecentPhotosGrid galleries={galleries} theme="classic" />
    </section>
  )
}
