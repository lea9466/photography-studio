'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { formatGalleryMetaLine } from '@/lib/public-gallery-copy'
import { ClassicPortfolioGrid, type ClassicPortfolioPhoto } from './ClassicPortfolioGrid'
import { ClassicPortfolioLightbox } from './ClassicPortfolioLightbox'
import { ClassicPortfolioContactCard } from './ClassicPortfolioContactCard'
import styles from './ClassicGalleryDetailPage.module.css'
import './classic-theme.css'

export type ClassicGalleryPhoto = { id: string; url: string }

export type ClassicGalleryDetailPageProps = {
  accentColor: string
  language: SiteLanguage
  /** Used by the contact card's "back to homepage" CTA. */
  homepagePath: string

  title: string
  photoCount: number
  /** Already formatted per `formatSiteDate` — matches app/public-gallery/[id]/page.tsx today. */
  galleryDate: string
  photos: ClassicGalleryPhoto[]
  contactCardTitle: string | null
  contactCardDescription: string | null
}

/**
 * Classic-theme single (public) gallery page — a client's own gallery, not
 * the photographer's portfolio. Ports the classic branch of galleryBody()
 * (lib/public-gallery-html.ts ~line 547): a plain uppercase "Editorial
 * Series" eyebrow (distinct from ClassicPortfolioHeader's own header, which
 * has no eyebrow text at all there — see this component's CSS module doc
 * comment), the same masonry grid/lightbox/contact-card the portfolio page
 * already uses (all genuinely shared with this page in the old renderer —
 * `MASONRY_STYLES`/`lightboxMarkup`/`generatePublicContactCardSection` are
 * defined once in lib/public-gallery-html.ts and reused by
 * lib/public-portfolio-html.ts, not two parallel implementations), reused
 * directly here rather than rebuilt. `ClassicPortfolioGrid`'s photo type
 * carries `galleryId`/`galleryName` for portfolio's cross-gallery tab
 * filtering, which this single-gallery page doesn't need — filled with
 * placeholder values below since the grid component never actually reads
 * them for anything (confirmed by reading it), only portfolio's own parent
 * page does.
 */
export function ClassicGalleryDetailPage({
  accentColor,
  language,
  homepagePath,
  title,
  photoCount,
  galleryDate,
  photos,
  contactCardTitle,
  contactCardDescription,
}: ClassicGalleryDetailPageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const gridPhotos: ClassicPortfolioPhoto[] = photos.map((photo) => ({
    id: photo.id,
    url: photo.url,
    galleryId: 'gallery',
    galleryName: title,
  }))

  function openLightbox(index: number) {
    setLightboxIndex(index)
  }
  function closeLightbox() {
    setLightboxIndex(null)
  }
  function showPrev() {
    setLightboxIndex((current) => (current !== null && current > 0 ? current - 1 : current))
  }
  function showNext() {
    setLightboxIndex((current) => (current !== null && current < photos.length - 1 ? current + 1 : current))
  }

  return (
    <>
      <main className="pt-24">
        <section className="mx-auto max-w-[1280px] px-[24px] pt-8">
          <header className={styles.header}>
            <span className={styles.eyebrow} style={{ color: accentColor }}>
              Editorial Series
            </span>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.divider} style={{ backgroundColor: accentColor }} />
            <p className={styles.meta}>{formatGalleryMetaLine(photoCount, galleryDate, language)}</p>
          </header>
        </section>

        <section className="mb-[80px] px-1 sm:px-1.5">
          <ClassicPortfolioGrid photos={gridPhotos} pageTitle={title} language={language} onPhotoClick={openLightbox} />
        </section>

        <section className="mx-auto max-w-[1280px] px-[24px] pb-24">
          <ClassicPortfolioContactCard
            title={contactCardTitle}
            description={contactCardDescription}
            accentColor={accentColor}
            homepagePath={homepagePath}
            language={language}
          />
        </section>
      </main>

      <ClassicPortfolioLightbox
        photos={photos.map((photo) => photo.url)}
        openIndex={lightboxIndex}
        onClose={closeLightbox}
        onPrev={showPrev}
        onNext={showNext}
        language={language}
      />
    </>
  )
}
