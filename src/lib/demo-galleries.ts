import type { GalleryCard } from '@/lib/public-galleries'

export const DEMO_GALLERY_ITEMS = [
  { title: 'ניו בורן', cover: '/images/demo/newborn.png' },
  { title: 'צילומי חוץ', cover: '/images/demo/outdoor.png' },
  { title: 'סמאש קייק', cover: '/images/demo/cake-smash.png' },
] as const

/** כותרות גלריות דמו ישנות — נמחקות בעת סנכרון */
export const LEGACY_DEMO_GALLERY_TITLES = [
  'צילומי משפחה',
  'ניו-בורן',
  'אירועים',
] as const

export const DEMO_GALLERY_TITLES = DEMO_GALLERY_ITEMS.map((item) => item.title)

export function getStaticDemoGalleryCards(): GalleryCard[] {
  return DEMO_GALLERY_ITEMS.map((item, index) => ({
    id: `demo-${index}`,
    title: item.title,
    cover: item.cover,
    count: 1,
  }))
}
