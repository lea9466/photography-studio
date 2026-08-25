'use client'

import { ClassicPortfolioPage } from '@/components/photographer/themes/classic/ClassicPortfolioPage'
import type { ClassicPortfolioPhoto } from '@/components/photographer/themes/classic/ClassicPortfolioGrid'

/**
 * Throwaway preview route for the classic-theme standalone Portfolio page —
 * see the homepage preview route's docblock (app/dev-preview/classic/
 * page.tsx) for why this exists and why it's safe to delete once real
 * page.tsx wiring replaces it. Mock data below stands in for what
 * app/[slug]/portfolio/page.tsx actually loads (photographer row + public
 * portfolio-type galleries + their display photos).
 */
const MOCK_ACCENT = '#b5816a'

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

const MOCK_PHOTOS: ClassicPortfolioPhoto[] = MOCK_GALLERY_DEFS.flatMap((gallery) =>
  Array.from({ length: gallery.count }, (_, i) => {
    const height = MOCK_HEIGHTS[(gallery.id.charCodeAt(1) + i) % MOCK_HEIGHTS.length]
    return {
      id: `${gallery.id}-${i}`,
      url: `https://picsum.photos/seed/portfolio-${gallery.id}-${i}/900/${height}`,
      galleryId: gallery.id,
      galleryName: gallery.name,
    }
  })
)

const MOCK_GALLERY_NAMES = MOCK_GALLERY_DEFS.map((g) => g.name).sort((a, b) => a.localeCompare(b, 'he'))

export default function ClassicPortfolioPreviewPage() {
  return (
    <ClassicPortfolioPage
      accentColor={MOCK_ACCENT}
      language="he"
      homepagePath="/dev-preview/classic"
      pageTitle="תיק עבודות"
      sectionTitle="מבחר מהעבודות שלנו לאורך השנים — חתונות, משפחות, הריון ואירועים"
      photos={MOCK_PHOTOS}
      galleryNames={MOCK_GALLERY_NAMES}
      contactCardTitle={null}
      contactCardDescription={null}
    />
  )
}
