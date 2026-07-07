import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'
import { buildMarketingMetadata } from '@/lib/seo/marketing-metadata'

export const metadata: Metadata = buildMarketingMetadata({
  title: 'הצהרת נגישות | סטודיו גלריה',
  canonicalPath: '/accessibility',
})

const LAST_UPDATED = '8 ביולי 2026'

const sections = [
  {
    id: 'commitment',
    title: 'מחויבות לנגישות',
    content: (
      <>
        <p>
          סטודיו גלריה מחויבת להנגשת האתר והשירותים הדיגיטליים שלה, כדי לאפשר לכל אדם,
          לרבות אנשים עם מוגבלות, לגלוש באתר, לנהל גלריות צילום, לשתף תמונות עם לקוחות
          ולהשתמש בכלל הכלים המוצעים בצורה עצמאית, שוויונית, מכבדת, בטוחה ונוחה.
        </p>
        <p>
          אנו פועלים לשיפור מתמיד של חוויית השימוש באתר, בהתאם לעקרונות השוויון וההכללה,
          ומתאימים את האתר לדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות
          לשירות), התשע״ג-2013.
        </p>
      </>
    ),
  },
  {
    id: 'standard',
    title: 'תקן הנגישות',
    content: (
      <p>
        האתר נבנה ומותאם בהתאם להנחיות{' '}
        <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> 2.1 ברמת AA, שהן
        ההנחיות המקובלות בעולם לנגישות תכנים באינטרנט. ההנגשה כוללת, בין היתר, התאמות
        לטכנולוגיות מסייעות, ניווט במקלדת, ניגודיות צבעים מספקת, מבנה סמנטי תקין
        ותיאורי תמונות חלופיים.
      </p>
    ),
  },
  {
    id: 'measures',
    title: 'התאמות הנגישות באתר',
    content: (
      <ul className="list-disc space-y-2 ps-6">
        <li>תמיכה בניווט מלא באמצעות מקלדת</li>
        <li>מבנה כותרות היררכי ותגיות HTML סמנטיות</li>
        <li>טקסט חלופי (alt) לתמונות משמעותיות</li>
        <li>ניגודיות צבעים בהתאם לדרישות רמת AA</li>
        <li>תמיכה בהגדלת טקסט דרך הגדרות הדפדפן</li>
        <li>תוויות ברורות לשדות טפסים ולכפתורים</li>
        <li>התאמה לצפייה במכשירים ניידים ושולחניים</li>
        <li>שימוש בגופן קריא ותמיכה בעברית מימין לשמאל (RTL)</li>
      </ul>
    ),
  },
  {
    id: 'browsers',
    title: 'תאימות לדפדפנים ולטכנולוגיות מסייעות',
    content: (
      <p>
        האתר נבדק ומותאם לשימוש בדפדפנים העדכניים: Chrome, Firefox, Safari ו-Edge,
        במחשבים שולחניים ובמכשירים ניידים. האתר תומך בטכנולוגיות מסייעות נפוצות, כגון
        קוראי מסך (NVDA, JAWS, VoiceOver) ותוכנות הגדלת מסך.
      </p>
    ),
  },
  {
    id: 'limitations',
    title: 'סייגים ומגבלות ידועות',
    content: (
      <>
        <p>
          למרות מאמצינו להנגיש את כלל רכיבי האתר, ייתכן שחלק מהתכנים שמועלים על ידי
          צלמים וסטודיואים — כגון תמונות, גלריות ועמודי תדמית מותאמים אישית — לא יהיו
          נגישים במלואם, בהתאם לאופן העלאתם ולתוכן המקורי.
        </p>
        <p>
          אנו ממשיכים לעבוד על שיפור הנגישות של רכיבים אינטראקטיביים מורכבים, כגון
          תצוגות גלריה, לייטבוקס וטפסי העלאת קבצים.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'יצירת קשר בנושא נגישות',
    content: (
      <>
        <p>
          אם נתקלתם בבעיית נגישות באתר, או שיש לכם הצעות לשיפור, נשמח לשמוע מכם.
          ניתן לפנות לרכז/ת הנגישות של סטודיו גלריה בדרכים הבאות:
        </p>
        <address className="mt-4 not-italic rounded-xl border border-[--border] bg-[--background] p-6">
          <dl className="space-y-3 text-sm sm:text-base">
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="min-w-28 font-semibold text-[--foreground]">שם:</dt>
              <dd className="text-[--muted]">[שם רכז/ת הנגישות]</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="min-w-28 font-semibold text-[--foreground]">טלפון:</dt>
              <dd>
                <a
                  href="tel:[מספר-טלפון]"
                  className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
                >
                  [מספר טלפון]
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="min-w-28 font-semibold text-[--foreground]">דוא״ל:</dt>
              <dd>
                <a
                  href="mailto:[כתובת-דואל]"
                  className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
                >
                  [כתובת דוא״ל]
                </a>
              </dd>
            </div>
          </dl>
        </address>
        <p className="mt-4">
          נשתדל לחזור אליכם בתוך 5 ימי עסקים ולטפל בפנייה בהקדם האפשרי.
        </p>
      </>
    ),
  },
  {
    id: 'complaints',
    title: 'הליך פניות ותלונות',
    content: (
      <p>
        אם פנייתכם לא טופלה לשביעות רצונכם, ניתן לפנות לנציבות שוויון זכויות לאנשים עם
        מוגבלות באמצעות טלפון 7377* או דרך{' '}
        <a
          href="https://www.gov.il/he/departments/units/commission_for_equal_rights_of_persons_with_disabilities"
          className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
          rel="noopener noreferrer"
          target="_blank"
        >
          אתר הנציבות (נפתח בחלון חדש)
        </a>
        .
      </p>
    ),
  },
] as const

export default function AccessibilityPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[--foreground] focus:px-4 focus:py-2 focus:text-[--background] focus:outline-none"
      >
        דילוג לתוכן העיקרי
      </a>

      <Nav />

      <main
        id="main-content"
        className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:pt-32"
        tabIndex={-1}
      >
        <article aria-labelledby="accessibility-title">
          <header className="mb-10 animate-fade-in">
            <p className="mb-2 text-sm text-[--muted]">
              <Link
                href="/"
                className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
              >
                דף הבית
              </Link>
              <span aria-hidden="true"> / </span>
              <span>הצהרת נגישות</span>
            </p>
            <h1
              id="accessibility-title"
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              הצהרת נגישות
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[--muted] sm:text-lg">
              מסמך זה מפרט את מחויבות סטודיו גלריה להנגשת האתר והשירותים הדיגיטליים
              לצלמים וללקוחותיהם, בהתאם לתקן WCAG 2.1 ברמת AA.
            </p>
            <p className="mt-2 text-sm text-[--muted]">
              עודכן לאחרונה: <time dateTime="2026-07-08">{LAST_UPDATED}</time>
            </p>
          </header>

          <nav
            aria-label="תוכן העניינים"
            className="mb-10 rounded-xl border border-[--border] bg-[--background] p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">תוכן העניינים</h2>
            <ol className="list-decimal space-y-2 ps-6 text-sm sm:text-base">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-10">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className="scroll-mt-28 animate-fade-in"
              >
                <h2
                  id={`${section.id}-heading`}
                  className="mb-4 text-xl font-semibold sm:text-2xl"
                >
                  {section.title}
                </h2>
                <div className="space-y-4 text-base leading-relaxed text-[--muted]">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <Footer />
    </>
  )
}
