'use client'

import { ModernBlogListPage } from '@/components/photographer/themes/modern/ModernBlogListPage'
import type { ModernBlogPostCardItem } from '@/components/photographer/themes/modern/ModernBlogPostCard'

/**
 * Throwaway preview route for the modern-theme blog LIST page — mirrors
 * app/dev-preview/classic/blog/page.tsx's exact mock shape.
 */
const MOCK_ACCENT = '#4f46e5'

const MOCK_POSTS: ModernBlogPostCardItem[] = [
  {
    id: 'p1',
    title: 'איך לבחור את הרגעים הנכונים לצילום',
    date: '10 באוגוסט 2026',
    excerpt:
      'כמה טיפים פשוטים שעוזרים לזוגות ולמשפחות להרגיש בנוח מול המצלמה, ולתעד רגעים אמיתיים ולא מבוימים.',
    coverUrl: 'https://picsum.photos/seed/modern-blog-1/1200/900',
  },
  {
    id: 'p2',
    title: 'מאחורי הקלעים של צילומי חתונה',
    date: '2 באוגוסט 2026',
    excerpt: 'יום שלם בחיים של צלם חתונות — מהכנות הכלה ועד הריקוד האחרון באולם.',
    coverUrl: 'https://picsum.photos/seed/modern-blog-2/1200/900',
  },
  {
    id: 'p3',
    title: 'תיעוד הריון: מה כדאי לדעת מראש',
    date: '20 ביולי 2026',
    excerpt: 'מתי הכי כדאי לתזמן את הצילומים, מה ללבוש, ואיך לבחור לוקיישן שמתאים לכם.',
    coverUrl: 'https://picsum.photos/seed/modern-blog-3/1200/900',
  },
  {
    id: 'p4',
    title: 'צילומי משפחה בחוץ — 5 טיפים',
    date: '5 ביולי 2026',
    excerpt: 'איך לגרום גם לילדים קטנים לשתף פעולה, ולצאת עם תמונות שבאמת ישקפו את המשפחה.',
    coverUrl: 'https://picsum.photos/seed/modern-blog-4/1200/900',
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
    excerpt: 'איך הכל התחיל, ולמה בחרנו להתמקד דווקא בסגנון צילום נקי ומודרני.',
    coverUrl: 'https://picsum.photos/seed/modern-blog-6/1200/900',
  },
]

export default function ModernBlogListPreviewPage() {
  return (
    <ModernBlogListPage
      accentColor={MOCK_ACCENT}
      language="he"
      displayStyle="circles"
      pageTitle="הבלוג שלנו"
      posts={MOCK_POSTS}
      hrefForPost={() => '/dev-preview/modern/blog/post'}
    />
  )
}
