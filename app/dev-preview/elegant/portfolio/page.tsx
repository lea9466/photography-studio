'use client'

import { ElegantPortfolioPage } from '@/components/photographer/themes/elegant/ElegantPortfolioPage'
import type { ElegantPortfolioPhoto } from '@/components/photographer/themes/elegant/ElegantPortfolioGrid'

/**
 * Throwaway preview route for the elegant-theme standalone Portfolio page —
 * mirrors app/dev-preview/dark/portfolio/page.tsx's exact mock shape. Safe to
 * delete once real page.tsx wiring replaces it.
 */
const MOCK_ACCENT = '#b8953f'

// Varied heights per seed give the CSS-columns masonry grid believable
// aspect-ratio variety instead of a uniform, unrealistic-looking wall.
const MOCK_HEIGHTS = [1100, 1300, 950, 1500, 1000, 1250]

const MOCK_GALLERY_DEFS: { id: string; name: string; count: number }[] = [
  { id: 'g1', name: 'שרון ודניאל', count: 10 },
  { id: 'g2', name: 'משפחת כהן', count: 8 },
  { id: 'g3', name: 'יעל ואיתי', count: 9 },
  { id: 'g4', name: 'הריון | נועה', count: 7 },
  { id: 'g5', name: 'סטודיו קונספט', count: 8 },
  { id: 'g6', name: 'בוגרים 2026', count: 6 },
  { id: 'g7', name: 'מסיבת יום הולדת', count: 7 },
  { id: 'g8', name: 'צילומי חוץ - אביב', count: 9 },
  { id: 'g9', name: 'לוקיישן ים', count: 8 },
]

const MOCK_PHOTOS: ElegantPortfolioPhoto[] = MOCK_GALLERY_DEFS.flatMap((gallery) =>
  Array.from({ length: gallery.count }, (_, i) => {
    const height = MOCK_HEIGHTS[(gallery.id.charCodeAt(1) + i) % MOCK_HEIGHTS.length]
    return {
      id: `${gallery.id}-${i}`,
      url: `https://picsum.photos/seed/elegant-portfolio-${gallery.id}-${i}/900/${height}`,
      galleryId: gallery.id,
      galleryName: gallery.name,
    }
  })
)

const MOCK_GALLERY_NAMES = MOCK_GALLERY_DEFS.map((g) => g.name).sort((a, b) => a.localeCompare(b, 'he'))

export default function ElegantPortfolioPreviewPage() {
  return (
    <>
      <ElegantPortfolioPage
        accentColor={MOCK_ACCENT}
        language="he"
        homepagePath="/dev-preview/elegant"
        pageTitle="תיק עבודות"
        sectionTitle="מבחר מהעבודות שלנו לאורך השנים — חתונות, משפחות, הריון ואירועים"
        photos={MOCK_PHOTOS}
        galleryNames={MOCK_GALLERY_NAMES}
        contactCardTitle={null}
        contactCardDescription={null}
      />
    </>
  )
}
