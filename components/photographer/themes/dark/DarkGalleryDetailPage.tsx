'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { formatGalleryMetaLine } from '@/lib/public-gallery-copy'
import { DarkPortfolioGrid, type DarkPortfolioPhoto } from './DarkPortfolioGrid'
import { DarkPortfolioLightbox } from './DarkPortfolioLightbox'
import { DarkPortfolioContactCard } from './DarkPortfolioContactCard'
import styles from './DarkGalleryDetailPage.module.css'
import './dark-theme.css'

export type DarkGalleryPhoto = {
  id: string
  url: string
  width?: number | null
  height?: number | null
}

export type DarkGalleryDetailPageProps = {
  accentColor: string
  language: SiteLanguage
  homepagePath: string

  title: string
  photoCount: number
  galleryDate: string
  photos: DarkGalleryPhoto[]
  contactCardTitle: string | null
  contactCardDescription: string | null
}

/** Dark-theme counterpart of ClassicGalleryDetailPage.tsx — see its doc
 * comment for why the grid/lightbox/contact-card are reused from the
 * portfolio page components rather than rebuilt. */
export function DarkGalleryDetailPage({
  accentColor,
  language,
  homepagePath,
  title,
  photoCount,
  galleryDate,
  photos,
  contactCardTitle,
  contactCardDescription,
}: DarkGalleryDetailPageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const gridPhotos: DarkPortfolioPhoto[] = photos.map((photo) => ({
    id: photo.id,
    url: photo.url,
    galleryId: 'gallery',
    galleryName: title,
    width: photo.width,
    height: photo.height,
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
        <section className="mx-auto max-w-[1280px] px-[24px] py-24">
          <header className={styles.header}>
            <span className={styles.eyebrow} style={{ color: accentColor }}>
              Portfolio
            </span>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.meta}>{formatGalleryMetaLine(photoCount, galleryDate, language)}</p>
          </header>
        </section>

        <section className="mb-[80px] px-1 sm:px-1.5">
          <DarkPortfolioGrid photos={gridPhotos} pageTitle={title} language={language} onPhotoClick={openLightbox} />
        </section>

        <section className="mx-auto max-w-[1280px] px-[24px] pb-24">
          <DarkPortfolioContactCard
            title={contactCardTitle}
            description={contactCardDescription}
            accentColor={accentColor}
            homepagePath={homepagePath}
            language={language}
          />
        </section>
      </main>

      <DarkPortfolioLightbox
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
