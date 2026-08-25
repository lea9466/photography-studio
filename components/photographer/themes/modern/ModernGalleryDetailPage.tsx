'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { formatGalleryMetaLine, getPublicGalleryModernHeaderEyebrow } from '@/lib/public-gallery-copy'
import { ModernPortfolioGrid, type ModernPortfolioPhoto } from './ModernPortfolioGrid'
import { ModernPortfolioLightbox } from './ModernPortfolioLightbox'
import { ModernPortfolioContactCard } from './ModernPortfolioContactCard'
import styles from './ModernGalleryDetailPage.module.css'

export type ModernGalleryPhoto = { id: string; url: string }

export type ModernGalleryDetailPageProps = {
  accentColor: string
  language: SiteLanguage
  homepagePath: string

  title: string
  photoCount: number
  galleryDate: string
  photos: ModernGalleryPhoto[]
  contactCardTitle: string | null
  contactCardDescription: string | null
}

/** Modern-theme counterpart of ClassicGalleryDetailPage.tsx — see its doc
 * comment for why the grid/lightbox/contact-card are reused from the
 * portfolio page components rather than rebuilt. Header markup differs from
 * both ModernPortfolioHeader (bespoke here, not that component) and from the
 * other themes' gallery-detail headers: the eyebrow is a *translated* word
 * ("Gallery"/"גלריה" via getPublicGalleryModernHeaderEyebrow), and the
 * divider is a 3-dot ornament row, not a single bar — confirmed by reading
 * galleryBody()'s modern branch directly. */
export function ModernGalleryDetailPage({
  accentColor,
  language,
  homepagePath,
  title,
  photoCount,
  galleryDate,
  photos,
  contactCardTitle,
  contactCardDescription,
}: ModernGalleryDetailPageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const gridPhotos: ModernPortfolioPhoto[] = photos.map((photo) => ({
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
              {getPublicGalleryModernHeaderEyebrow(language)}
            </span>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.ornament}>
              <span className={styles.ornamentLine} style={{ background: `color-mix(in srgb, ${accentColor} 25%, transparent)` }} />
              <span className={styles.ornamentDot} style={{ background: accentColor }} />
              <span className={styles.ornamentLine} style={{ background: `color-mix(in srgb, ${accentColor} 25%, transparent)` }} />
            </div>
            <p className={styles.meta}>{formatGalleryMetaLine(photoCount, galleryDate, language)}</p>
          </header>
        </section>

        <section className="mb-[48px] px-1 sm:px-1.5">
          <ModernPortfolioGrid photos={gridPhotos} pageTitle={title} language={language} onPhotoClick={openLightbox} />
        </section>

        <section className="mx-auto max-w-[1280px] px-[24px] pb-24">
          <ModernPortfolioContactCard
            title={contactCardTitle}
            description={contactCardDescription}
            accentColor={accentColor}
            homepagePath={homepagePath}
            language={language}
          />
        </section>
      </main>

      <ModernPortfolioLightbox
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
