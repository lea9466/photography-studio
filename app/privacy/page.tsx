import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'
import { buildMarketingMetadata } from '@/lib/seo/marketing-metadata'

export const metadata: Metadata = buildMarketingMetadata({
  title: 'מדיניות פרטיות | סטודיו גלריה',
  canonicalPath: '/privacy',
})

const LAST_UPDATED = '8 ביולי 2026'

const sections = [
  {
    id: 'intro',
    title: 'מבוא',
    content: (
      <>
        <p>
          סטודיו גלריה (&quot;החברה&quot;, &quot;אנחנו&quot;) מפעילה פלטפורמה לניהול גלריות
          צילום, אתרי תדמית לצלמים ושיתוף תמונות עם לקוחות. מדיניות פרטיות זו מסבירה כיצד
          אנו אוספים, משתמשים, שומרים ומגנים על המידע האישי שלך בעת השימוש באתר ובשירותים
          שלנו.
        </p>
        <p>
          השימוש בשירות מהווה הסכמה למדיניות זו. אם אינך מסכים/ה לתנאים, אנא הימנע/י
          משימוש בשירות.
        </p>
      </>
    ),
  },
  {
    id: 'data-collected',
    title: 'איזה מידע אנו אוספים',
    content: (
      <ul className="list-disc space-y-2 ps-6">
        <li>
          <strong>פרטי חשבון:</strong> שם, כתובת דוא&quot;ל, סיסמה (מוצפנת), שם סטודיו
          ופרטי פרופיל נוספים שתבחר/י למלא.
        </li>
        <li>
          <strong>תוכן שהועלה:</strong> תמונות, גלריות, לוגואים, טקסטים וחומרי שיווק
          שאת/ה מעלה לפלטפורמה.
        </li>
        <li>
          <strong>פרטי לקוחות:</strong> שמות, כתובות דוא&quot;ל ומספרי טלפון של לקוחותיך
          שאת/ה מזין/ה במערכת לצורך שליחת גלריות.
        </li>
        <li>
          <strong>נתוני שימוש:</strong> כתובת IP, סוג דפדפן, דפים שנצפו, זמני גישה
          ונתונים טכניים לצורך אבטחה, תפעול ושיפור השירות.
        </li>
        <li>
          <strong>פניות ומשוב:</strong> תוכן טפסי יצירת קשר, משוב ופניות תמיכה.
        </li>
      </ul>
    ),
  },
  {
    id: 'purposes',
    title: 'מטרות השימוש במידע',
    content: (
      <ul className="list-disc space-y-2 ps-6">
        <li>הפעלת החשבון, אימות משתמשים ומתן גישה לשירותים</li>
        <li>אחסון, עיבוד והצגת גלריות ותמונות</li>
        <li>שליחת הודעות דוא&quot;ל (הזמנות לגלריה, התראות, איפוס סיסמה)</li>
        <li>תמיכה טכנית, מענה לפניות ושיפור חוויית המשתמש</li>
        <li>אבטחת המערכת, מניעת הונאות ואכיפת תנאי השימוש</li>
        <li>עמידה בדרישות חוקיות ורגולטוריות, ככל שנדרש</li>
      </ul>
    ),
  },
  {
    id: 'sharing',
    title: 'שיתוף מידע עם צדדים שלישיים',
    content: (
      <>
        <p>איננו מוכרים את המידע האישי שלך. אנו עשויים לשתף מידע עם ספקי שירות מהימנים בלבד, לצורך הפעלת השירות:</p>
        <ul className="mt-4 list-disc space-y-2 ps-6">
          <li>
            <strong>Supabase</strong> — אחסון מסד נתונים, אימות משתמשים וניהול חשבונות
          </li>
          <li>
            <strong>Cloudflare R2</strong> — אחסון קבצי תמונה ומדיה
          </li>
          <li>
            <strong>Resend</strong> — שליחת הודעות דוא&quot;ל
          </li>
        </ul>
        <p className="mt-4">
          ספקים אלה מחויבים לעבד מידע בהתאם להוראותינו ולמטרות המפורטות במדיניות זו.
          ייתכן שנחשוף מידע גם כאשר הדבר נדרש על פי חוק, צו בית משפט או בקשת רשות מוסמכת.
        </p>
      </>
    ),
  },
  {
    id: 'storage',
    title: 'אחסון ואבטחת מידע',
    content: (
      <>
        <p>
          המידע מאוחסן בשרתים מאובטחים של ספקי הענן שלנו. אנו מיישמים אמצעי אבטחה סבירים
          ומקובלים בתעשייה, לרבות:
        </p>
        <ul className="mt-4 list-disc space-y-2 ps-6">
          <li>הצפנת תעבורה (HTTPS/TLS)</li>
          <li>Row Level Security (RLS) במסד הנתונים</li>
          <li>הפרדה בין מפתחות API ציבוריים לסודיים</li>
          <li>בקרת גישה מבוססת הרשאות לכל פעולה רגישה</li>
        </ul>
        <p className="mt-4">
          עם זאת, אין שיטת העברה או אחסון באינטרנט שהיא בטוחה לחלוטין. אנו פועלים
          לצמצום הסיכונים, אך איננו יכולים להבטיח אבטחה מוחלטת.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'משך שמירת המידע',
    content: (
      <p>
        נשמור את המידע האישי שלך כל עוד חשבונך פעיל או כנדרש לצורך מתן השירות. לאחר
        מחיקת חשבון, נמחק או נאנונם מידע אישי בתוך פרק זמן סביר, למעט מידע שאנו מחויבים
        לשמור על פי חוק או לצורכי גיבוי ואבטחה לתקופה מוגבלת.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'זכויותיך',
    content: (
      <ul className="list-disc space-y-2 ps-6">
        <li>לעיין במידע האישי שאנו מחזיקים עליך</li>
        <li>לבקש תיקון מידע שגוי או לא מעודכן</li>
        <li>לבקש מחיקת חשבון ומידע אישי (בכפוף לחובות חוקיות)</li>
        <li>לבקש הגבלת עיבוד מידע במקרים מסוימים</li>
        <li>למשוך הסכמה שניתנה בעבר, ככל שהדבר חל על עיבוד מסוים</li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: 'עוגיות (Cookies)',
    content: (
      <p>
        האתר משתמש בעוגיות הכרחיות לצורך אימות משתמשים, ניהול סשנים וגישה לגלריות
        מוגנות בסיסמה. עוגיות אלה נדרשות לתפקוד תקין של השירות. איננו משתמשים בעוגיות
        פרסום מצד שלישי.
      </p>
    ),
  },
  {
    id: 'children',
    title: 'ילדים',
    content: (
      <p>
        השירות מיועד לצלמים מבוגרים ואינו מכוון לילדים מתחת לגיל 18. איננו אוספים
        ביודעין מידע אישי מילדים. אם נודע לנו שנאסף מידע כזה, נפעל למחיקתו.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'שינויים במדיניות',
    content: (
      <p>
        אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו בדף זה עם תאריך
        עדכון חדש. המשך שימוש בשירות לאחר פרסום השינויים מהווה הסכמה למדיניות המעודכנת.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'יצירת קשר',
    content: (
      <>
        <p>
          לשאלות, בקשות למימוש זכויותיך או פניות בנושא פרטיות, ניתן לפנות אלינו:
        </p>
        <ul className="mt-4 list-none space-y-2">
          <li>
            דוא&quot;ל:{' '}
            <a
              href="mailto:privacy@studio-galleries.com"
              className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
            >
              privacy@studio-galleries.com
            </a>
          </li>
        </ul>
        <p className="mt-4">
          לנושאי נגישות, ראו גם את{' '}
          <Link
            href="/accessibility"
            className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
          >
            הצהרת הנגישות
          </Link>
          .
        </p>
      </>
    ),
  },
] as const

export default function PrivacyPage() {
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
        <article aria-labelledby="privacy-title">
          <header className="mb-10 animate-fade-in">
            <p className="mb-2 text-sm text-[--muted]">
              <Link
                href="/"
                className="text-[--primary] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
              >
                דף הבית
              </Link>
              <span aria-hidden="true"> / </span>
              <span>מדיניות פרטיות</span>
            </p>
            <h1
              id="privacy-title"
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              מדיניות פרטיות
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[--muted] sm:text-lg">
              מסמך זה מפרט כיצד סטודיו גלריה אוספת, משתמשת ומגינה על המידע האישי של
              משתמשי הפלטפורמה ולקוחותיהם.
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
