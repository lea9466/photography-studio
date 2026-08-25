'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { ClassicPortfolioHeader } from './ClassicPortfolioHeader'
import { ClassicPortfolioTabs, CLASSIC_PORTFOLIO_ALL_FILTER } from './ClassicPortfolioTabs'
import { ClassicPortfolioGrid, type ClassicPortfolioPhoto } from './ClassicPortfolioGrid'
import { ClassicPortfolioLightbox } from './ClassicPortfolioLightbox'
import { ClassicPortfolioContactCard } from './ClassicPortfolioContactCard'
import './classic-theme.css'

export type { ClassicPortfolioPhoto }

export type ClassicPortfolioPageProps = {
  accentColor: string
  language: SiteLanguage
  /** Used by the page's own contact card ("back to homepage"), not by site chrome (the header/footer now live in app/dev-preview/classic/layout.tsx). */
  homepagePath: string

  pageTitle: string
  sectionTitle?: string | null
  photos: ClassicPortfolioPhoto[]
  galleryNames: string[]
  contactCardTitle: string | null
  contactCardDescription: string | null
}

/**
 * Full classic-theme standalone Portfolio page — a photographer's complete
 * body of work, distinct from the homepage's small "Collections" preview
 * grid (ClassicGalleriesSection, capped at 4 items). Ports the `classic`
 * branch of generatePublicPortfolioPageHTML (lib/public-portfolio-html.ts)
 * plus the shared masonry-grid/lightbox pieces it pulls in from
 * lib/public-gallery-html.ts.
 *
 * Deferred vs. the old renderer (see the task report for the full list):
 * incremental batch-loading via IntersectionObserver
 * (PORTFOLIO_BATCH_SIZE=20 in the old script) is replaced by rendering the
 * whole filtered set at once — the per-cell reveal-on-scroll animation
 * already gives a progressive-loading feel, and real batch-loading is a
 * meaningfully bigger chunk of state for a photo count where it's not
 * obviously needed yet.
 */
export function ClassicPortfolioPage(props: ClassicPortfolioPageProps) {
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

  const [activeFilter, setActiveFilter] = useState<string>(CLASSIC_PORTFOLIO_ALL_FILTER)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredPhotos =
    activeFilter === CLASSIC_PORTFOLIO_ALL_FILTER
      ? photos
      : photos.filter((photo) => photo.galleryName === activeFilter)

  function handleSelectFilter(filter: string) {
    setActiveFilter(filter)
    // The old script's resetGrid() rebuilds the whole grid on filter change
    // without an open lightbox to worry about (browsing and lightbox are
    // mutually exclusive there); closing here avoids an open lightbox
    // pointing at an index that no longer exists in the new filtered set.
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
          <ClassicPortfolioHeader
            pageTitle={pageTitle}
            sectionTitle={sectionTitle}
            photoCount={photos.length}
            accentColor={accentColor}
            language={language}
          />
          <ClassicPortfolioTabs
            galleryNames={galleryNames}
            activeFilter={activeFilter}
            onSelect={handleSelectFilter}
            accentColor={accentColor}
            language={language}
          />
        </section>

        <section className="mb-[80px] px-1 sm:px-1.5">
          <ClassicPortfolioGrid
            photos={filteredPhotos}
            pageTitle={pageTitle}
            language={language}
            onPhotoClick={openLightbox}
          />
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
