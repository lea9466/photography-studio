import Link from 'next/link'
import { galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import { RecentPhotosGrid, type RecentPhotosGridItem } from '../shared/RecentPhotosGrid'
import { SectionTitle } from '../shared/SectionTitle'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import styles from './ModernRecentPhotosSection.module.css'

export type ModernRecentPhotosSectionProps = {
  title: string
  galleries: RecentPhotosGridItem[]
  accentColor: string
  language: SiteLanguage
  /** "View all photos" link — only rendered in "portfolio" gallery layout mode, mirrors portfolioCtaHtml in generate-homepage-html.ts. */
  portfolioHref?: string | null
}

export function ModernRecentPhotosSection({
  title,
  galleries,
  accentColor,
  language,
  portfolioHref,
}: ModernRecentPhotosSectionProps) {
  // Matches the old renderer: the whole section only exists once at least
  // one gallery actually has photos.
  const hasPhotos = galleries.some((g) => (g.photoPool?.length ?? 0) > 0)
  if (!hasPhotos) return null

  const copy = getSiteChromeCopy(language)
  const arrow = galleryCardArrow(language)

  return (
    <section id="recent-photos" className={styles.section}>
      <div className={styles.headerRow} style={{ '--modern-accent': accentColor } as React.CSSProperties}>
        <div className={styles.titles}>
          <ModernSectionEyebrow>LATEST</ModernSectionEyebrow>
          <SectionTitle color="#0f172a" className={styles.title}>
            {title}
          </SectionTitle>
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
      <RecentPhotosGrid galleries={galleries} theme="modern" />
    </section>
  )
}
