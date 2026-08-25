'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { DarkPortfolioHeader } from './DarkPortfolioHeader'
import { DarkPortfolioTabs, DARK_PORTFOLIO_ALL_FILTER } from './DarkPortfolioTabs'
import { DarkPortfolioGrid, type DarkPortfolioPhoto } from './DarkPortfolioGrid'
import { DarkPortfolioLightbox } from './DarkPortfolioLightbox'
import { DarkPortfolioContactCard } from './DarkPortfolioContactCard'
import './dark-theme.css'

export type { DarkPortfolioPhoto }

export type DarkPortfolioPageProps = {
  accentColor: string
  language: SiteLanguage
  /** Still needed here (not just by the header) — DarkPortfolioContactCard links back to the homepage. */
  homepagePath: string

  pageTitle: string
  sectionTitle?: string | null
  photos: DarkPortfolioPhoto[]
  galleryNames: string[]
  contactCardTitle: string | null
  contactCardDescription: string | null
}

/**
 * Full dark-theme standalone Portfolio page — mirrors
 * Classic/ModernPortfolioPage.tsx's exact composition/state shape (active
 * gallery filter + open lightbox index, both lifted here rather than living
 * in a DOM querySelector dance). See DarkPortfolioGrid.tsx's doc comment:
 * dark's masonry cell recipe (MASONRY_CELL_STYLE.dark) uses its own
 * placeholder color (#1A1A22), so only the grid cell bg differs from
 * classic/modern there — the header/tabs/contact-card chrome around it
 * differs visually a lot more (dark's plain uppercase label instead of
 * classic's cursive script or modern's eyebrow+SectionTitle pair).
 *
 * Header/Footer are no longer rendered here — see
 * `app/dev-preview/dark/layout.tsx`'s doc comment for why (single persistent
 * chrome instance across every dark preview route instead of a fresh one per
 * page).
 */
export function DarkPortfolioPage(props: DarkPortfolioPageProps) {
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

  const [activeFilter, setActiveFilter] = useState<string>(DARK_PORTFOLIO_ALL_FILTER)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredPhotos =
    activeFilter === DARK_PORTFOLIO_ALL_FILTER
      ? photos
      : photos.filter((photo) => photo.galleryName === activeFilter)

  function handleSelectFilter(filter: string) {
    setActiveFilter(filter)
    // Matches Classic/ModernPortfolioPage: closes any open lightbox on filter
    // change so it can't end up pointing at an index that no longer exists in
    // the new filtered set.
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
          <DarkPortfolioHeader
            pageTitle={pageTitle}
            sectionTitle={sectionTitle}
            photoCount={photos.length}
            accentColor={accentColor}
            language={language}
          />
          <DarkPortfolioTabs
            galleryNames={galleryNames}
            activeFilter={activeFilter}
            onSelect={handleSelectFilter}
            accentColor={accentColor}
            language={language}
          />
        </section>

        <section className="mb-[80px] px-1 sm:px-1.5">
          <DarkPortfolioGrid
            photos={filteredPhotos}
            pageTitle={pageTitle}
            language={language}
            onPhotoClick={openLightbox}
          />
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
