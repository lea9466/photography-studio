import Link from 'next/link'
import {
  CalendarClock,
  Download,
  FolderPlus,
  Gift,
  Globe,
  KeyRound,
  Layers,
  ListChecks,
  Lock,
  MousePointerClick,
  Send,
  ShieldCheck,
  Stamp,
  Ticket,
  Wand2,
} from 'lucide-react'
import {
  AboutHero,
  AboutSection,
  Callout,
  ChipRow,
  ConceptCard,
  ConceptGrid,
} from './AboutKit'
import { AboutFlow } from './AboutFlow'
import { ShieldPhotoArtwork } from './AboutArtwork'

export function PrivateGalleriesAboutContent() {
  return (
    <>
      <AboutHero
        eyebrow="גלריות פרטיות"
        eyebrowIcon={<Lock className="h-3.5 w-3.5" />}
        title="גלריית לקוח אחת — שליחה, בחירה ומסירה"
        lead="כל לקוח מקבל גלריה משלו, מוגנת ומאובטחת. הוא מסמן תמונות בעצמו, ואת מורידה בדיוק את מה שבחר — באיכות מלאה, אוטומטית, בלי רשימות מספרים."
        artwork={<ShieldPhotoArtwork />}
      />

      <AboutSection
        icon={<ShieldCheck className="h-5 w-5" />}
        title="מה מייחד גלריה פרטית"
      >
        <ConceptGrid>
          <ConceptCard
            tone="plum"
            icon={<KeyRound className="h-5 w-5" />}
            title="גלריה נפרדת לכל לקוח"
          >
            אין סיסמאות לנהל — הלקוח מקבל קוד חד-פעמי במייל בכל כניסה.
          </ConceptCard>
          <ConceptCard
            tone="sky"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="דומיין נפרד ומאובטח"
          >
            פתוח לגמרי בנטפרי, כולל התמונות עצמן. הקבצים לא נשלחים במייל ולא דולפים החוצה.
          </ConceptCard>
          <ConceptCard
            tone="amber"
            icon={<Stamp className="h-5 w-5" />}
            title="תצוגה בסימן מים"
          >
            לאורך כל הבחירה הלקוח רואה גרסה מוקטנת וממותגת — בלי הורדה, עד שאת מאשרת.
          </ConceptCard>
          <ConceptCard
            tone="emerald"
            icon={<Download className="h-5 w-5" />}
            title="הבחירה היא הקבצים עצמם"
          >
            לא רשימה של מספרים להתאים ידנית — מורידה ZIP מסודר לאלבום ולעיבוד.
          </ConceptCard>
        </ConceptGrid>
      </AboutSection>

      <AboutSection
        icon={<MousePointerClick className="h-5 w-5" />}
        title="איך זה עובד"
        subtitle="חמישה שלבים — מהיצירה ועד שהלקוח מוריד את התמונות המוכנות."
      >
        <AboutFlow
          steps={[
            {
              tone: 'plum',
              icon: <FolderPlus className="h-5 w-5" />,
              title: 'יוצרת גלריה',
              caption: 'משייכת ללקוח, קובעת שם, תפוגה, מכסת בחירה וסימן מים.',
            },
            {
              tone: 'sky',
              icon: <Send className="h-5 w-5" />,
              title: 'מעלה ושולחת קישור',
              caption: 'הלקוח מקבל מייל עם קישור לגלריה שלו. התמונות נשארות בגלריה.',
            },
            {
              tone: 'violet',
              icon: <MousePointerClick className="h-5 w-5" />,
              title: 'הלקוח בוחר',
              caption: 'מסמן על התמונה עצמה — רשימה לאלבום ורשימה לעיבוד, בנפרד.',
            },
            {
              tone: 'amber',
              icon: <Download className="h-5 w-5" />,
              title: 'מורידה נבחרות',
              caption: 'ZIP באיכות מלאה, מסודר — בלי לרשום ובלי להתאים.',
            },
            {
              tone: 'emerald',
              icon: <Wand2 className="h-5 w-5" />,
              title: 'מעלה מעובדות',
              caption: 'בטאב "מעובדות" — הלקוח מקבל מייל ומוריד את כולן בקליק.',
            },
          ]}
        />
      </AboutSection>

      <AboutSection
        icon={<ListChecks className="h-5 w-5" />}
        title="מה מגדירים בכל גלריה"
      >
        <ChipRow
          items={[
            { icon: <KeyRound className="h-4 w-4" />, label: 'שם ולקוח משויך' },
            { icon: <CalendarClock className="h-4 w-4" />, label: 'תאריך תפוגה' },
            { icon: <ListChecks className="h-4 w-4" />, label: 'מכסת בחירה' },
            { icon: <Stamp className="h-4 w-4" />, label: 'סימן מים' },
            { icon: <Download className="h-4 w-4" />, label: 'הרשאות הורדה' },
          ]}
        />
      </AboutSection>

      <AboutSection icon={<Layers className="h-5 w-5" />} title="כמה גלריות אפשר">
        <div className="grid gap-4 sm:grid-cols-3">
          <ConceptCard
            tone="emerald"
            icon={<Gift className="h-5 w-5" />}
            title="הראשונה חינם"
          >
            גלריית לקוח מלאה מקצה לקצה, בלי הגבלת זמן.
          </ConceptCard>
          <ConceptCard
            tone="plum"
            icon={<Layers className="h-5 w-5" />}
            title="מסלול"
          >
            כמה גלריות פעילות במקביל, לפי המסלול שנבחר ב"חבילות שימוש".
          </ConceptCard>
          <ConceptCard
            tone="amber"
            icon={<Ticket className="h-5 w-5" />}
            title="פאס לגלריה בודדת"
          >
            צריכה עוד גלריה אחת בלי מסלול? קונה פאס והוא נצרב בגלריה הבאה שתיצרי.
          </ConceptCard>
        </div>
      </AboutSection>

      <Callout
        tone="sky"
        icon={<Globe className="h-5 w-5" />}
        title="גלריה פרטית ≠ גלריה ציבורית"
      >
        גלריה פרטית נשלחת ללקוח ולא מופיעה באתר. גלריה ציבורית היא חלק מתיק
        העבודות שמוצג לכולם.{' '}
        <Link
          href="/dashboard/about/public-site"
          className="font-semibold text-[#7D3A52] underline underline-offset-2"
        >
          על האתר הציבורי
        </Link>
      </Callout>
    </>
  )
}
