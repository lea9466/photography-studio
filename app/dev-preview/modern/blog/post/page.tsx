'use client'

import { ModernBlogPostPage } from '@/components/photographer/themes/modern/ModernBlogPostPage'

/**
 * Throwaway preview route for the modern-theme single BLOG POST page —
 * mirrors app/dev-preview/classic/blog/post/page.tsx's exact mock shape. A
 * fixed (non-dynamic) route, per the task brief, so there's no `postId`
 * param to thread through mock data.
 */
const MOCK_ACCENT = '#4f46e5'

const MOCK_CONTENT = `היה לנו כבוד עצום לתעד את היום הזה. מהרגע שהגענו לבית של הכלה ועד הריקוד האחרון באולם, כל רגע היה שונה ומרגש בדרכו שלו.

התאורה בשעת בין-ערביים הייתה בדיוק כמו שקיווינו לה — רכה, זהובה, ומחמיאה לכל תמונה. ניסינו לתעד לא רק את הרגעים ה"מסודרים" אלא בעיקר את הרגעים הספונטניים: מבט, חיבוק, דמעה של שמחה.

תודה לזוג המקסים שנתן בנו אמון מלא לאורך כל היום. מחכים כבר לראות אתכם שוב.`

export default function ModernBlogPostPreviewPage() {
  return (
    <ModernBlogPostPage
      accentColor={MOCK_ACCENT}
      language="he"
      post={{
        id: 'p2',
        title: 'מאחורי הקלעים של צילומי חתונה',
        subtitle: 'יום שלם בחיים של צלם חתונות',
        content: MOCK_CONTENT,
        date: '2 באוגוסט 2026',
        coverUrl: 'https://picsum.photos/seed/modern-blog-2/1920/1200',
        images: [
          'https://picsum.photos/seed/modern-blog-2-extra-1/1400/1000',
          'https://picsum.photos/seed/modern-blog-2-extra-2/1400/1000',
        ],
      }}
      postPath="/dev-preview/modern/blog/post"
      prevPost={{
        id: 'p1',
        title: 'איך לבחור את הרגעים הנכונים לצילום',
        coverUrl: 'https://picsum.photos/seed/modern-blog-1/400/300',
        href: '/dev-preview/modern/blog/post',
      }}
      nextPost={{
        id: 'p3',
        title: 'תיעוד הריון: מה כדאי לדעת מראש',
        coverUrl: 'https://picsum.photos/seed/modern-blog-3/400/300',
        href: '/dev-preview/modern/blog/post',
      }}
    />
  )
}
