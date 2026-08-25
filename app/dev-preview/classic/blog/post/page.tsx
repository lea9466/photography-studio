'use client'

import { ClassicBlogPostPage } from '@/components/photographer/themes/classic/ClassicBlogPostPage'

/**
 * Throwaway preview route for the classic-theme single BLOG POST page — see
 * the homepage preview route's docblock (app/dev-preview/classic/page.tsx)
 * for why this exists. A fixed (non-dynamic) route, per the task brief, so
 * there's no `postId` param to thread through mock data.
 *
 * Mock `content` below is deliberately plain free text with blank-line
 * paragraph breaks (matching the real `posts.content` column — see the
 * field note on ClassicBlogPostPageItem) — not markup.
 */
const MOCK_ACCENT = '#b5816a'

const MOCK_CONTENT = `היה לנו כבוד עצום לתעד את היום הזה. מהרגע שהגענו לבית של הכלה ועד הריקוד האחרון באולם, כל רגע היה שונה ומרגש בדרכו שלו.

התאורה בשעת בין-ערביים הייתה בדיוק כמו שקיווינו לה — רכה, זהובה, ומחמיאה לכל תמונה. ניסינו לתעד לא רק את הרגעים ה"מסודרים" אלא בעיקר את הרגעים הספונטניים: מבט, חיבוק, דמעה של שמחה.

תודה לזוג המקסים שנתן בנו אמון מלא לאורך כל היום. מחכים כבר לראות אתכם שוב.`

export default function ClassicBlogPostPreviewPage() {
  return (
    <ClassicBlogPostPage
        accentColor={MOCK_ACCENT}
        language="he"
        post={{
          id: 'p2',
          title: 'מאחורי הקלעים של צילומי חתונה',
          subtitle: 'יום שלם בחיים של צלם חתונות',
          content: MOCK_CONTENT,
          date: '2 באוגוסט 2026',
          coverUrl: 'https://picsum.photos/seed/blog-2/1920/1200',
          images: [
            'https://picsum.photos/seed/blog-2-extra-1/1400/1000',
            'https://picsum.photos/seed/blog-2-extra-2/1400/1000',
          ],
        }}
        postPath="/dev-preview/classic/blog/post"
        prevPost={{
          id: 'p1',
          title: 'איך לבחור את הרגעים הנכונים לצילום',
          coverUrl: 'https://picsum.photos/seed/blog-1/400/300',
          href: '/dev-preview/classic/blog/post',
        }}
        nextPost={{
          id: 'p3',
          title: 'תיעוד הריון: מה כדאי לדעת מראש',
          coverUrl: 'https://picsum.photos/seed/blog-3/400/300',
          href: '/dev-preview/classic/blog/post',
        }}
      />
  )
}
