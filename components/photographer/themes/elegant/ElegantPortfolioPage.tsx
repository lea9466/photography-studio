'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { ElegantPortfolioHeader } from './ElegantPortfolioHeader'
import { ElegantPortfolioTabs, ELEGANT_PORTFOLIO_ALL_FILTER } from './ElegantPortfolioTabs'
import { ElegantPortfolioGrid, type ElegantPortfolioPhoto } from './ElegantPortfolioGrid'
import { ElegantPortfolioLightbox } from './ElegantPortfolioLightbox'
import { ElegantPortfolioContactCard } from './ElegantPortfolioContactCard'
import './elegant-theme.css'

export type { ElegantPortfolioPhoto }

export type ElegantPortfolioPageProps = {
  accentColor: string
  language: SiteLanguage
  /** Used by the page's own contact card ("back to homepage"), not by site chrome (the header/footer now live in app/dev-preview/elegant/layout.tsx). */
  homepagePath: string

  pageTitle: string
  sectionTitle?: string | null
  photos: ElegantPortfolioPhoto[]
  galleryNames: string[]
  contactCardTitle: string | null
  contactCardDescription: string | null
}

/**
 * Full elegant-theme standalone Portfolio page — mirrors
 * Classic/Dark/ModernPortfolioPage.tsx's exact composition/state shape
 * (active gallery filter + open lightbox index, both lifted here rather than
 * living in a DOM querySelector dance). See ElegantPortfolioGrid.tsx's doc
 * comment: elegant's masonry cell recipe (MASONRY_CELL_STYLE.elegant) uses
 * the same placeholder color as classic/modern (#eae8e5) — only the
 * header/tabs/contact-card chrome around it is elegant-specific (see those
 * components' doc comments for the font/color divergences found by reading
 * lib/public-portfolio-html.ts and lib/public-gallery-html.ts directly).
 */
export function ElegantPortfolioPage(props: ElegantPortfolioPageProps) {
  const {
    accentColor,
    language,
    homepagePath,
    pageTitle,
    sectionTitle,
    photos,
    galleryNames,
    contactCardTitle,
    contactCardDescription,
  } = props

  const [activeFilter, setActiveFilter] = useState<string>(ELEGANT_PORTFOLIO_ALL_FILTER)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredPhotos =
    activeFilter === ELEGANT_PORTFOLIO_ALL_FILTER
      ? photos
      : photos.filter((photo) => photo.galleryName === activeFilter)

  function handleSelectFilter(filter: string) {
    setActiveFilter(filter)
    // Matches Classic/Dark/ModernPortfolioPage: closes any open lightbox on
    // filter change so it can't end up pointing at an index that no longer
    // exists in the new filtered set.
    setLightboxIndex(null)
  }

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
    setLightboxIndex((current) =>
      current !== null && current < filteredPhotos.length - 1 ? current + 1 : current
    )
  }

  return (
    <>
      <main className="pt-24">
        <section className="mx-auto max-w-[1280px] px-[24px] pt-8">
          <ElegantPortfolioHeader
            pageTitle={pageTitle}
            sectionTitle={sectionTitle}
            photoCount={photos.length}
            accentColor={accentColor}
            language={language}
          />
          <ElegantPortfolioTabs
            galleryNames={galleryNames}
            activeFilter={activeFilter}
            onSelect={handleSelectFilter}
            accentColor={accentColor}
            language={language}
          />
        </section>

        <section className="mb-[80px] px-1 sm:px-1.5">
          <ElegantPortfolioGrid
            photos={filteredPhotos}
            pageTitle={pageTitle}
            language={language}
            onPhotoClick={openLightbox}
          />
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
        photos={filteredPhotos.map((photo) => photo.url)}
        openIndex={lightboxIndex}
        onClose={closeLightbox}
        onPrev={showPrev}
        onNext={showNext}
        language={language}
      />
    </>
  )
}
