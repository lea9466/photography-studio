'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { ModernPortfolioHeader } from './ModernPortfolioHeader'
import { ModernPortfolioTabs, MODERN_PORTFOLIO_ALL_FILTER } from './ModernPortfolioTabs'
import { ModernPortfolioGrid, type ModernPortfolioPhoto } from './ModernPortfolioGrid'
import { ModernPortfolioLightbox } from './ModernPortfolioLightbox'
import { ModernPortfolioContactCard } from './ModernPortfolioContactCard'
import './modern-theme.css'

export type { ModernPortfolioPhoto }

export type ModernPortfolioPageProps = {
  /** Still used by this page's own contact card ("back to home" link) —
   * studioName/logoUrl/shouldColorLogo/blogPath/beforeAfterPath/portfolioPath/
   * hasFaq/hasPackages were header/footer-only and moved to the shared
   * app/dev-preview/modern/layout.tsx that now renders ModernSiteHeader/
   * ModernSiteFooter around this page. */
  accentColor: string
  language: SiteLanguage
  homepagePath: string

  pageTitle: string
  sectionTitle?: string | null
  photos: ModernPortfolioPhoto[]
  galleryNames: string[]
  contactCardTitle: string | null
  contactCardDescription: string | null
}

/**
 * Full modern-theme standalone Portfolio page — mirrors
 * ClassicPortfolioPage.tsx's exact composition/state shape (active gallery
 * filter + open lightbox index, both lifted here rather than living in a DOM
 * querySelector dance). See ModernPortfolioGrid.tsx's doc comment: modern's
 * masonry cell recipe (MASONRY_CELL_STYLE.modern) is pixel-identical to
 * classic's, so only the header/tabs/contact-card chrome around the grid
 * actually differ visually between the two themes.
 */
export function ModernPortfolioPage(props: ModernPortfolioPageProps) {
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

  const [activeFilter, setActiveFilter] = useState<string>(MODERN_PORTFOLIO_ALL_FILTER)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredPhotos =
    activeFilter === MODERN_PORTFOLIO_ALL_FILTER
      ? photos
      : photos.filter((photo) => photo.galleryName === activeFilter)

  function handleSelectFilter(filter: string) {
    setActiveFilter(filter)
    // Matches ClassicPortfolioPage: closes any open lightbox on filter change
    // so it can't end up pointing at an index that no longer exists in the
    // new filtered set.
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
          <ModernPortfolioHeader
            pageTitle={pageTitle}
            sectionTitle={sectionTitle}
            photoCount={photos.length}
            accentColor={accentColor}
            language={language}
          />
          <ModernPortfolioTabs
            galleryNames={galleryNames}
            activeFilter={activeFilter}
            onSelect={handleSelectFilter}
            accentColor={accentColor}
            language={language}
          />
        </section>

        <section className="mb-[80px] px-1 sm:px-1.5">
          <ModernPortfolioGrid
            photos={filteredPhotos}
            pageTitle={pageTitle}
            language={language}
            onPhotoClick={openLightbox}
          />
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
