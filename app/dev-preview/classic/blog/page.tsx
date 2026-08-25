'use client'

import { ClassicBlogListPage } from '@/components/photographer/themes/classic/ClassicBlogListPage'
import type { ClassicBlogPostCardItem } from '@/components/photographer/themes/classic/ClassicBlogPostCard'

/**
 * Throwaway preview route for the classic-theme blog LIST page — see the
 * homepage preview route's docblock (app/dev-preview/classic/page.tsx) for
 * why this exists and why it's safe to delete once real page.tsx wiring
 * replaces it. Mock data below stands in for what a real route would load
 * via fetchPublicBlogPosts() (lib/public-blog-posts.ts).
 */
const MOCK_ACCENT = '#b5816a'

const MOCK_POSTS: ClassicBlogPostCardItem[] = [
  {
    id: 'p1',
    title: 'איך לבחור את הרגעים הנכונים לצילום',
    date: '10 באוגוסט 2026',
    excerpt:
      'כמה טיפים פשוטים שעוזרים לזוגות ולמשפחות להרגיש בנוח מול המצלמה, ולתעד רגעים אמיתיים ולא מבוימים.',
    coverUrl: 'https://picsum.photos/seed/blog-1/1200/900',
  },
  {
    id: 'p2',
    title: 'מאחורי הקלעים של צילומי חתונה',
    date: '2 באוגוסט 2026',
    excerpt: 'יום שלם בחיים של צלם חתונות — מהכנות הכלה ועד הריקוד האחרון באולם.',
    coverUrl: 'https://picsum.photos/seed/blog-2/1200/900',
  },
  {
    id: 'p3',
    title: 'תיעוד הריון: מה כדאי לדעת מראש',
    date: '20 ביולי 2026',
    excerpt: 'מתי הכי כדאי לתזמן את הצילומים, מה ללבוש, ואיך לבחור לוקיישן שמתאים לכם.',
    coverUrl: 'https://picsum.photos/seed/blog-3/1200/900',
  },
  {
    id: 'p4',
    title: 'צילומי משפחה בחוץ — 5 טיפים',
    date: '5 ביולי 2026',
    excerpt: 'איך לגרום גם לילדים קטנים לשתף פעולה, ולצאת עם תמונות שבאמת ישקפו את המשפחה.',
    coverUrl: 'https://picsum.photos/seed/blog-4/1200/900',
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
    excerpt: 'איך הכל התחיל, ולמה בחרנו להתמקד דווקא בסגנון צילום קלאסי ורגשי.',
    coverUrl: 'https://picsum.photos/seed/blog-6/1200/900',
  },
]

export default function ClassicBlogListPreviewPage() {
  return (
    <ClassicBlogListPage
      accentColor={MOCK_ACCENT}
      language="he"
      pageTitle="הבלוג שלנו"
      posts={MOCK_POSTS}
      hrefForPost={() => '/dev-preview/classic/blog/post'}
    />
  )
}
