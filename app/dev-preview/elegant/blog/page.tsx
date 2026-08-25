'use client'

import { ElegantBlogListPage } from '@/components/photographer/themes/elegant/ElegantBlogListPage'
import type { ElegantBlogPostCardItem } from '@/components/photographer/themes/elegant/ElegantBlogPostCard'

/**
 * Throwaway preview route for the elegant-theme blog LIST page — mirrors
 * app/dev-preview/dark/blog/page.tsx's exact mock shape.
 */
const MOCK_ACCENT = '#b8953f'

const MOCK_POSTS: ElegantBlogPostCardItem[] = [
  {
    id: 'p1',
    title: 'איך לבחור את הרגעים הנכונים לצילום',
    date: '10 באוגוסט 2026',
    excerpt:
      'כמה טיפים פשוטים שעוזרים לזוגות ולמשפחות להרגיש בנוח מול המצלמה, ולתעד רגעים אמיתיים ולא מבוימים.',
    coverUrl: 'https://picsum.photos/seed/elegant-blog-1/1200/900',
  },
  {
    id: 'p2',
    title: 'מאחורי הקלעים של צילומי חתונה',
    date: '2 באוגוסט 2026',
    excerpt: 'יום שלם בחיים של צלם חתונות — מהכנות הכלה ועד הריקוד האחרון באולם.',
    coverUrl: 'https://picsum.photos/seed/elegant-blog-2/1200/900',
  },
  {
    id: 'p3',
    title: 'תיעוד הריון: מה כדאי לדעת מראש',
    date: '20 ביולי 2026',
    excerpt: 'מתי הכי כדאי לתזמן את הצילומים, מה ללבוש, ואיך לבחור לוקיישן שמתאים לכם.',
    coverUrl: 'https://picsum.photos/seed/elegant-blog-3/1200/900',
  },
  {
    id: 'p4',
    title: 'צילומי משפחה בחוץ — 5 טיפים',
    date: '5 ביולי 2026',
    excerpt: 'איך לגרום גם לילדים קטנים לשתף פעולה, ולצאת עם תמונות שבאמת ישקפו את המשפחה.',
    coverUrl: 'https://picsum.photos/seed/elegant-blog-4/1200/900',
  },
  {
    id: 'p5',
    title: 'שאלות שכדאי לשאול את הצלם שלכם',
    date: '18 ביוני 2026',
    excerpt: 'רשימת שאלות קצרה שעוזרת לוודא שאתם והצלם באותו עמוד לפני יום הצילום.',
    coverUrl: null,
  },
  {
    id: 'p6',
    title: 'הסיפור שמאחורי הסטודיו שלנו',
    date: '1 ביוני 2026',
    excerpt: 'איך הכל התחיל, ולמה בחרנו להתמקד דווקא בסגנון צילום עדין ואינטימי.',
    coverUrl: 'https://picsum.photos/seed/elegant-blog-6/1200/900',
  },
]

export default function ElegantBlogListPreviewPage() {
  return (
    <>
      <ElegantBlogListPage
        accentColor={MOCK_ACCENT}
        language="he"
        displayStyle="cards"
        pageTitle="הבלוג שלנו"
        posts={MOCK_POSTS}
        hrefForPost={() => '/dev-preview/elegant/blog/post'}
      />
    </>
  )
}
