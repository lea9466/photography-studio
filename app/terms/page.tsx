import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'
import { buildMarketingMetadata } from '@/lib/seo/marketing-metadata'

export const metadata: Metadata = buildMarketingMetadata({
  title: 'תקנון ותנאי שימוש | סטודיו גלריה',
  canonicalPath: '/terms',
})

const LAST_UPDATED = '8 ביולי 2026'

const sections = [
  {
    id: 'intro',
    title: 'מבוא',
    content: (
      <>
        <p>
          ברוכים הבאים לסטודיו גלריה. תקנון ותנאי שימוש אלה (&quot;התקנון&quot;) מסדירים את
          השימוש שלך בפלטפורמה, באתר ובשירותים הנלווים (&quot;השירות&quot;). השימוש בשירות
          מהווה הסכמה מלאה לתנאים אלה.
        </p>
        <p>
          אם אינך מסכים/ה לתנאים, אנא הימנע/י מהשימוש בשירות. לנושאי פרטיות, ראו את{' '}
          <Link href="/privacy" className="text-[--primary] underline-offset-4 hover:underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: 'definitions',
    title: 'הגדרות',
    content: (
      <ul className="list-disc space-y-2 ps-6">
        <li>
          <strong>משתמש/ת:</strong> צלם/ת או סטודיו צילום הרשום/ה לשירות.
        </li>
        <li>
          <strong>לקוח/ה:</strong> אדם המקבל/ת גישה לגלריה באמצעות סיסמה או קישור.
        </li>
        <li>
          <strong>תוכן:</strong> תמונות, טקסטים, לוגואים, גלריות וכל חומר אחר שהועלה לשירות.
        </li>
        <li>
          <strong>חשבון:</strong> פרופיל משתמש רשום בפלטפורמה.
        </li>
      </ul>
    ),
  },
  {
    id: 'service',
    title: 'השירות',
    content: (
      <p>
        סטודיו גלריה מספקת כלים לניהול גלריות צילום, שיתוף תמונות עם לקוחות, בניית אתר
        תדמית, ניהול חבילות צילום ועוד. אנו שומרים לעצמנו את הזכות לעדכן, לשפר, להשעות
        או להפסיק חלקים מהשירות, באופן זמני או קבוע, לפי שיקול דעתנו.
      </p>
    ),
  },
  {
    id: 'account',
    title: 'פתיחת חשבון ואחריות המשתמש',
    content: (
      <ul className="list-disc space-y-2 ps-6">
        <li>עליך לספק פרטים נכונים ומדויקים בעת ההרשמה.</li>
        <li>את/ה אחראי/ת לשמירה על סודיות פרטי הגישה לחשבון.</li>
        <li>כל פעולה שתבוצע דרך חשבונך תיחשב כפעולה שביצעת.</li>
        <li>יש להודיע לנו מיד על כל שימוש לא מורשה בחשבון.</li>
        <li>אסור ליצור חשבונות מזויפים או להתחזות לאדם אחר.</li>
      </ul>
    ),
  },
  {
    id: 'content',
    title: 'תוכן משתמשים',
    content: (
      <>
        <p>
          את/ה שומר/ת על כל הזכויות בתוכן שאת/ה מעלה. בעצם העלאת תוכן, את/ה מעניק/ה לסטודיו
          גלריה רישיון מוגבל, לא בלעדי וללא תמלוגים, לאחסן, להציג, לעבד ולהפיץ את התוכן
          אך ורק לצורך מתן השירות.
        </p>
        <p className="mt-4">אסור להעלות תוכן ש:</p>
        <ul className="mt-2 list-disc space-y-2 ps-6">
          <li>מפר זכויות יוצרים, סימני מסחר או זכויות צד שלישי</li>
          <li>פוגעני, מאיים, מטעה או בלתי חוקי</li>
          <li>כולל תוכן מיני בלתי חוקי או מפר פרטיות ללא הסכמה</li>
          <li>מכיל וירוסים, קוד זדוני או ניסיונות פריצה</li>
        </ul>
      </>
    ),
  },
  {
    id: 'client-galleries',
    title: 'גלריות לקוחות',
    content: (
      <p>
        בעת שיתוף גלריות עם לקוחות, את/ה אחראי/ת לקבלת הסכמה מתאימה לשיתוף התמונות ולעמידה
        בדיני הגנת הפרטיות. סיסמאות גלריה מאוחסנות בצורה מוצפנת (bcrypt). את/ה אחראי/ת
        לניהול הגישה, לתוקף הגלריה ולשמירה על סודיות הסיסמאות.
      </p>
    ),
  },
  {
    id: 'prohibited',
    title: 'שימושים אסורים',
    content: (
      <ul className="list-disc space-y-2 ps-6">
        <li>ניסיון לעקוף מנגנוני אבטחה, RLS או בקרות גישה</li>
        <li>סריקה אוטומטית, scraping או עומס מוגזם על השרתים</li>
        <li>שימוש מסחרי לא מורשה בפלטפורמה ללא אישור</li>
        <li>העברת חשבון לצד שלישי ללא אישור</li>
        <li>כל שימוש הפוגע בזכויות משתמשים אחרים או בצדדים שלישיים</li>
      </ul>
    ),
  },
  {
    id: 'ip',
    title: 'קניין רוחני של סטודיו גלריה',
    content: (
      <p>
        כל הזכויות בפלטפורמה, בעיצוב, בקוד, בלוגו, בשם המסחרי ובחומרי השיווק של סטודיו
        גלריה שייכות לחברה או לבעלי הרישיון שלה. אין להעתיק, לשכפל, להפיץ או ליצור יצירות
        נגזרות ללא אישור מראש בכתב.
      </p>
    ),
  },
  {
    id: 'availability',
    title: 'זמינות השירות',
    content: (
      <p>
        אנו פועלים לשמירה על זמינות גבוהה של השירות, אך איננו מתחייבים לפעילות רציפה ללא
        הפרעות. תחזוקה, תקלות טכניות, כוח עליון או עדכונים עשויים לגרום להפסקות זמניות.
        השירות ניתן &quot;כמות שהוא&quot; (AS IS) ללא אחריות מפורשת או משתמעת.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'הגבלת אחריות',
    content: (
      <p>
        סטודיו גלריה לא תישא באחריות לנזקים עקיפים, תוצאתיים, אובדן רווחים, אובדן נתונים
        או פגיעה במוניטין הנובעים מהשימוש בשירות. אחריותנו הכוללת, ככל שתוגבל על פי דין,
        לא תעלה על הסכום ששילמת עבור השירות בשלושת החודשים שקדמו לאירוע.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'סיום והשעיה',
    content: (
      <p>
        אנו רשאים להשעות או לסגור חשבון בגין הפרת תנאים אלה, פעילות חשודה או שימוש בלתי
        חוקי. את/ה רשאי/ת לסגור את חשבונך בכל עת. עם סגירת החשבון, יימחק או יאונן מידע
        אישי בהתאם למדיניות הפרטיות, בכפוף לחובות שמירה חוקיות.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'שינויים בתקנון',
    content: (
      <p>
        אנו עשויים לעדכן תקנון זה מעת לעת. שינויים מהותיים יפורסמו בדף זה. המשך שימוש
        בשירות לאחר פרסום השינויים מהווה הסכמה לתנאים המעודכנים.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'דין וסמכות שיפוט',
    content: (
      <p>
        על תקנון זה יחולו דיני מדינת ישראל. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים
        בישראל, אלא אם נקבע אחרת בחוק.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'יצירת קשר',
    content: (
      <p>
        לשאלות בנוגע לתקנון זה, ניתן לפנות אלינו בדוא&quot;ל:{' '}
        <a
          href="mailto:legal@studio-galleries.com"
          className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
        >
          legal@studio-galleries.com
        </a>
      </p>
    ),
  },
] as const

export default function TermsPage() {
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
        <article aria-labelledby="terms-title">
          <header className="mb-10 animate-fade-in">
            <p className="mb-2 text-sm text-[--muted]">
              <Link
                href="/"
                className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
              >
                דף הבית
              </Link>
              <span aria-hidden="true"> / </span>
              <span>תקנון ותנאי שימוש</span>
            </p>
            <h1
              id="terms-title"
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              תקנון ותנאי שימוש
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[--muted] sm:text-lg">
              מסמך זה מגדיר את תנאי השימוש בפלטפורמת סטודיו גלריה לצלמים, סטודיואים
              ולקוחותיהם.
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
