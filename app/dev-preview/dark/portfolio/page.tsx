'use client'

import { DarkPortfolioPage } from '@/components/photographer/themes/dark/DarkPortfolioPage'
import type { DarkPortfolioPhoto } from '@/components/photographer/themes/dark/DarkPortfolioGrid'

/**
 * Throwaway preview route for the dark-theme standalone Portfolio page — see
 * app/dev-preview/dark/page.tsx's docblock for why this exists and why it's
 * safe to delete once real page.tsx wiring replaces it. Mirrors
 * app/dev-preview/modern/portfolio/page.tsx's exact mock shape.
 */
const MOCK_ACCENT = '#e0396b'

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

const MOCK_PHOTOS: DarkPortfolioPhoto[] = MOCK_GALLERY_DEFS.flatMap((gallery) =>
  Array.from({ length: gallery.count }, (_, i) => {
    const height = MOCK_HEIGHTS[(gallery.id.charCodeAt(1) + i) % MOCK_HEIGHTS.length]
    return {
      id: `${gallery.id}-${i}`,
      url: `https://picsum.photos/seed/dark-portfolio-${gallery.id}-${i}/900/${height}`,
      galleryId: gallery.id,
      galleryName: gallery.name,
    }
  })
)

const MOCK_GALLERY_NAMES = MOCK_GALLERY_DEFS.map((g) => g.name).sort((a, b) => a.localeCompare(b, 'he'))

export default function DarkPortfolioPreviewPage() {
  return (
    <DarkPortfolioPage
      accentColor={MOCK_ACCENT}
      language="he"
      homepagePath="/dev-preview/dark"
      pageTitle="תיק עבודות"
      sectionTitle="מבחר מהעבודות שלנו לאורך השנים — חתונות, משפחות, הריון ואירועים"
      photos={MOCK_PHOTOS}
      galleryNames={MOCK_GALLERY_NAMES}
      contactCardTitle={null}
      contactCardDescription={null}
    />
  )
}
