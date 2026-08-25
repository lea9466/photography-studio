'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { formatGalleryMetaLine } from '@/lib/public-gallery-copy'
import { ElegantPortfolioGrid, type ElegantPortfolioPhoto } from './ElegantPortfolioGrid'
import { ElegantPortfolioLightbox } from './ElegantPortfolioLightbox'
import { ElegantPortfolioContactCard } from './ElegantPortfolioContactCard'
import styles from './ElegantGalleryDetailPage.module.css'

export type ElegantGalleryPhoto = { id: string; url: string }

export type ElegantGalleryDetailPageProps = {
  accentColor: string
  language: SiteLanguage
  homepagePath: string

  title: string
  photoCount: number
  galleryDate: string
  photos: ElegantGalleryPhoto[]
  contactCardTitle: string | null
  contactCardDescription: string | null
}

/** Elegant-theme counterpart of ClassicGalleryDetailPage.tsx — see its doc
 * comment for why the grid/lightbox/contact-card are reused from the
 * portfolio page components rather than rebuilt. Header markup differs from
 * ElegantPortfolioHeader (larger 80px bottom margin, non-italic 18px meta —
 * confirmed by reading galleryBody()'s elegant branch directly, not assumed
 * from the portfolio page's own header). */
export function ElegantGalleryDetailPage({
  accentColor,
  language,
  homepagePath,
  title,
  photoCount,
  galleryDate,
  photos,
  contactCardTitle,
  contactCardDescription,
}: ElegantGalleryDetailPageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const gridPhotos: ElegantPortfolioPhoto[] = photos.map((photo) => ({
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
              Aesthetic Collection
            </span>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.divider} style={{ backgroundColor: accentColor }} />
            <p className={styles.meta}>{formatGalleryMetaLine(photoCount, galleryDate, language)}</p>
          </header>
        </section>

        <section className="mb-[80px] px-1 sm:px-1.5">
          <ElegantPortfolioGrid photos={gridPhotos} pageTitle={title} language={language} onPhotoClick={openLightbox} />
        </section>

        <section className="mx-auto max-w-[1280px] px-[24px] pb-24">
          <ElegantPortfolioContactCard
            title={contactCardTitle}
            description={contactCardDescription}
            accentColor={accentColor}
            homepagePath={homepagePath}
            language={language}
          />
        </section>
      </main>

      <ElegantPortfolioLightbox
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
