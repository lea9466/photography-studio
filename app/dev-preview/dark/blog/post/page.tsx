'use client'

import { DarkBlogPostPage } from '@/components/photographer/themes/dark/DarkBlogPostPage'

/**
 * Throwaway preview route for the dark-theme single BLOG POST page —
 * mirrors app/dev-preview/modern/blog/post/page.tsx's exact mock shape. A
 * fixed (non-dynamic) route, per the task brief, so there's no `postId`
 * param to thread through mock data.
 */
const MOCK_ACCENT = '#e0396b'

const MOCK_CONTENT = `היה לנו כבוד עצום לתעד את היום הזה. מהרגע שהגענו לבית של הכלה ועד הריקוד האחרון באולם, כל רגע היה שונה ומרגש בדרכו שלו.

התאורה בשעת בין-ערביים הייתה בדיוק כמו שקיווינו לה — רכה, זהובה, ומחמיאה לכל תמונה. ניסינו לתעד לא רק את הרגעים ה"מסודרים" אלא בעיקר את הרגעים הספונטניים: מבט, חיבוק, דמעה של שמחה.

תודה לזוג המקסים שנתן בנו אמון מלא לאורך כל היום. מחכים כבר לראות אתכם שוב.`

export default function DarkBlogPostPreviewPage() {
  return (
    <DarkBlogPostPage
        accentColor={MOCK_ACCENT}
        language="he"
        post={{
          id: 'p2',
          title: 'מאחורי הקלעים של צילומי חתונה',
          subtitle: 'יום שלם בחיים של צלם חתונות',
          content: MOCK_CONTENT,
          date: '2 באוגוסט 2026',
          coverUrl: 'https://picsum.photos/seed/dark-blog-2/1920/1200',
          images: [
            'https://picsum.photos/seed/dark-blog-2-extra-1/1400/1000',
            'https://picsum.photos/seed/dark-blog-2-extra-2/1400/1000',
          ],
        }}
        postPath="/dev-preview/dark/blog/post"
        prevPost={{
          id: 'p1',
          title: 'איך לבחור את הרגעים הנכונים לצילום',
          coverUrl: 'https://picsum.photos/seed/dark-blog-1/400/300',
          href: '/dev-preview/dark/blog/post',
        }}
        nextPost={{
          id: 'p3',
          title: 'תיעוד הריון: מה כדאי לדעת מראש',
          coverUrl: 'https://picsum.photos/seed/dark-blog-3/400/300',
          href: '/dev-preview/dark/blog/post',
        }}
      />
  )
}
