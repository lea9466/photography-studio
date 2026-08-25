'use client'

import { DarkHomePage } from '@/components/photographer/themes/dark/DarkHomePage'

/**
 * Throwaway preview route — NOT linked from any nav, not part of the real
 * public-site routing. Mirrors app/dev-preview/classic/page.tsx exactly
 * (same mock data shape) so the in-progress dark theme rebuild
 * (components/photographer/themes/dark/) can be looked at in an actual
 * browser. Safe to delete once the real page.tsx wiring replaces it.
 */
const MOCK_ACCENT = '#e0396b'

const MOCK_HERO_DESKTOP = [
  'https://picsum.photos/seed/studio-hero-1/1920/1080',
  'https://picsum.photos/seed/studio-hero-2/1920/1080',
  'https://picsum.photos/seed/studio-hero-3/1920/1080',
]
const MOCK_HERO_MOBILE = [
  'https://picsum.photos/seed/studio-hero-1m/900/1600',
  'https://picsum.photos/seed/studio-hero-2m/900/1600',
]

const MOCK_GALLERIES = [
  { id: 'g1', title: 'שרון ודניאל', createdAt: '2026-03-10', previewUrl: 'https://picsum.photos/seed/gallery-1/1200/1500' },
  { id: 'g2', title: 'משפחת כהן', createdAt: '2026-02-02', previewUrl: 'https://picsum.photos/seed/gallery-2/1200/1500' },
  { id: 'g3', title: 'יעל ואיתי', createdAt: '2025-11-20', previewUrl: 'https://picsum.photos/seed/gallery-3/1200/1500' },
  { id: 'g4', title: 'הריון | נועה', createdAt: '2025-09-14', previewUrl: 'https://picsum.photos/seed/gallery-4/1200/1500' },
]

const MOCK_RECENT_PHOTOS = MOCK_GALLERIES.map((g, i) => ({
  id: g.id,
  title: g.title,
  photoPool: Array.from({ length: 6 }, (_, j) => `https://picsum.photos/seed/recent-${i}-${j}/800/1000`),
}))

const MOCK_PACKAGES = [
  {
    id: 'p1',
    name: 'חבילת בייסיק',
    priceAmount: 1800,
    durationText: 'עד 3 שעות צילום',
    includes: ['עורך תמונות דיגיטלי', '50 תמונות ערוכות', 'גלריה פרטית מקוונת'],
    isFeatured: false,
  },
  {
    id: 'p2',
    name: 'חבילת פרימיום',
    priceAmount: 3200,
    durationText: 'יום צילום מלא',
    includes: ['120 תמונות ערוכות', 'אלבום מודפס', 'גלריה פרטית מקוונת', 'צלם שני'],
    isFeatured: true,
  },
  {
    id: 'p3',
    name: 'חבילת VIP',
    priceAmount: 5400,
    durationText: 'יומיים צילום',
    includes: ['250 תמונות ערוכות', '2 אלבומים מודפסים', 'סרטון הייילייטס', 'צלם שני + וידאו'],
    isFeatured: false,
  },
]

const MOCK_TESTIMONIALS = [
  {
    id: 't1',
    title: 'חוויה בלתי נשכחת',
    content: 'הצוות היה מקצועי ורגיש, התוצאות עלו על כל הציפיות שלנו. ממליצים בחום!',
    shootType: 'חתונה',
    reviewDate: '2026-01-15',
    createdAt: '2026-01-15',
    imageUrl: 'https://picsum.photos/seed/dark-review-1/200/200',
  },
  {
    id: 't2',
    title: 'תודה על הרגעים',
    content: 'ידעו בדיוק איך לגרום לנו להרגיש בנוח מול המצלמה. התמונות מדהימות.',
    shootType: 'משפחתי',
    reviewDate: '2025-12-02',
    createdAt: '2025-12-02',
    imageUrl: 'https://picsum.photos/seed/dark-review-2/200/200',
  },
  {
    id: 't3',
    title: 'פשוט מושלם',
    content: 'תשומת לב לפרטים הקטנים ותקשורת מצוינת לאורך כל התהליך.',
    shootType: 'אירוסין',
    reviewDate: '2025-10-22',
    createdAt: '2025-10-22',
    imageUrl: 'https://picsum.photos/seed/dark-review-3/200/200',
  },
]

const MOCK_POSTS = [
  {
    id: 'post-1',
    title: 'מאחורי הקלעים של צילומי חתונה',
    content: 'יום שלם בחיים של צלם חתונות — מהכנות הכלה ועד הריקוד האחרון באולם.',
    date: '2 באוגוסט 2026',
    coverUrl: 'https://picsum.photos/seed/blog-teaser-1/900/700',
  },
  {
    id: 'post-2',
    title: 'איך לבחור את הרגעים הנכונים לצילום',
    content: 'כמה טיפים פשוטים שעוזרים לזוגות ולמשפחות להרגיש טבעי ולתעד רגעים אמיתיים ולא מבוימים.',
    date: '10 באוגוסט 2026',
    coverUrl: 'https://picsum.photos/seed/blog-teaser-2/900/700',
  },
  {
    id: 'post-3',
    title: 'צילומי משפחה בחוץ — 5 טיפים',
    content: 'איך לגרום גם לילדים קטנים לשתף פעולה, ולצאת עם תמונות שבאמת ישקפו את המשפחה.',
    date: '5 ביולי 2026',
    coverUrl: null,
  },
]

const MOCK_FAQ = [
  { question: 'כמה זמן לוקח לקבל את התמונות?', answer: 'בדרך כלל תוך 3-4 שבועות מיום הצילום.' },
  { question: 'האם אפשר להזמין צלם שני?', answer: 'בהחלט — ניתן להוסיף צלם שני בכל אחת מהחבילות.' },
  { question: 'איפה מתבצעים הצילומים?', answer: 'בכל מקום שתבחרו — סטודיו, טבע, או כל לוקיישן אחר.' },
  { question: 'האם ניתן לקבל קבצי RAW?', answer: 'לא באופן קבוע, אך ניתן לתאם מראש בתוספת תשלום.' },
]

export default function DarkThemePreviewPage() {
  return (
    <DarkHomePage
        studioName="סטודיו נועה שחר"
        photographerName="נועה שחר"
        logoUrl={null}
        accentColor={MOCK_ACCENT}
        language="he"
        blogPath="/dev-preview/dark/blog"
        portfolioPath="/dev-preview/dark/portfolio"
        galleryLayoutMode="separated"
        heroDesktopImages={MOCK_HERO_DESKTOP}
        heroMobileImages={MOCK_HERO_MOBILE}
        heroVideoUrl={null}
        aboutText="מתעדים רגעים אמיתיים, בעדינות ובכנות."
        aboutTitle="הסיפור שלנו"
        aboutSubtitle="תיעוד רגעים אמיתיים, בעדינות ובכנות"
        aboutDescription="אנחנו מתמחים בצילום אופנה, אירועים ופורטרטים — בסטייל עכשווי ונועז שמדבר בעדינות עם האור והצללים."
        aboutImageUrl="https://picsum.photos/seed/about-photographer/900/1100"
        statsClients={240}
        statsProjects={410}
        statsYears={12}
        galleriesTitle="קולקציות נבחרות"
        galleries={MOCK_GALLERIES}
        recentPhotosTitle="תמונות אחרונות"
        recentPhotosGalleries={MOCK_RECENT_PHOTOS}
        postsTitle="הבלוג שלנו"
        postsDisplayStyle="cards"
        posts={MOCK_POSTS}
        hrefForPost={() => '/dev-preview/dark/blog/post'}
        packagesTitle="חבילות"
        packagesSubtitle="בחרו את החבילה שמתאימה לכם"
        packages={MOCK_PACKAGES}
        testimonialsTitle="ממה שאומרים עלינו"
        testimonials={MOCK_TESTIMONIALS}
        faqItems={MOCK_FAQ}
        phone="050-1234567"
        email="hello@noa-shahar-studio.co.il"
        address="רחוב אלנבי 45, תל אביב"
        contactTitle={null}
        contactSubtitle={null}
        contactDesktopUrl="https://picsum.photos/seed/dark-contact-bg/1600/1200"
        contactMobileUrl="https://picsum.photos/seed/dark-contact-bg-m/900/1600"
        onContactSubmit={(values) => {
          console.log('[preview] contact form submitted', values)
        }}
      />
  )
}
