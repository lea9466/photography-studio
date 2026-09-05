import Link from 'next/link'
import {
  CircleHelp,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Images,
  Lock,
  Mail,
  MessageSquareQuote,
  MonitorCheck,
  Package,
  Palette,
  Search,
  Settings,
} from 'lucide-react'
import {
  AboutHero,
  AboutSection,
  Callout,
  ConceptCard,
  ConceptGrid,
} from './AboutKit'
import { AboutFlow } from './AboutFlow'
import { SiteAnatomy, TabSectionMap } from './SiteAnatomy'
import { BrowserArtwork } from './AboutArtwork'

export function PublicSiteAboutContent() {
  return (
    <>
      <AboutHero
        eyebrow="האתר הציבורי"
        eyebrowIcon={<Globe className="h-3.5 w-3.5" />}
        title="אתר התדמית של הסטודיו שלך"
        lead="תיק עבודות, חבילות, המלצות ובלוג — בעיצוב שאת בוחרת ובכתובת משלך. את קובעת מתי הוא עולה לאוויר ומי רואה אותו."
        artwork={<BrowserArtwork />}
      />

      <AboutSection icon={<Palette className="h-5 w-5" />} title="מה זה כולל">
        <ConceptGrid>
          <ConceptCard
            tone="plum"
            icon={<Palette className="h-5 w-5" />}
            title="אתר תדמית מלא"
          >
            ארבע ערכות עיצוב לבחירה, כל אחת עם צבע מותג משלך שצובע כותרות, כפתורים
            וקישורים.
          </ConceptCard>
          <ConceptCard
            tone="sky"
            icon={<Globe className="h-5 w-5" />}
            title="כתובת משלך"
          >
            תת-כתובת בפלטפורמה (<span dir="ltr">studio-galleries.com/studio</span>),
            או דומיין אישי לגמרי.
          </ConceptCard>
          <ConceptCard
            tone="amber"
            icon={<Eye className="h-5 w-5" />}
            title="את קובעת מתי הוא עולה"
          >
            מצב "בבנייה" מסתיר את האתר מהציבור עד שהוא מוכן — ואז פותחת אותו לכולם.
          </ConceptCard>
          <ConceptCard
            tone="emerald"
            icon={<Search className="h-5 w-5" />}
            title="מופיע בגוגל"
          >
            עם השם והלוגו שלך. דומיין אישי נותן גם עיגול (favicon) ייחודי בתוצאות.
          </ConceptCard>
        </ConceptGrid>
      </AboutSection>

      <AboutSection
        icon={<MonitorCheck className="h-5 w-5" />}
        title="מבנה דף הבית"
        subtitle="הסקשנים מופיעים לפי הסדר הזה. סקשן בלי תוכן פשוט לא מוצג."
      >
        <SiteAnatomy
          sections={[
            { tone: 'plum', label: 'כותרת ראשית', hint: 'תמונת רקע + שם הסטודיו' },
            { tone: 'rose', label: 'אודות', hint: 'טקסט, תמונה ושורת נתונים' },
            { tone: 'sky', label: 'תיק עבודות', hint: 'הגלריות הציבוריות שלך' },
            { tone: 'violet', label: 'לפני / אחרי עיבוד', pro: true },
            { tone: 'amber', label: 'חבילות צילום', pro: true },
            { tone: 'emerald', label: 'המלצות לקוחות', pro: true },
            { tone: 'rose', label: 'מהבלוג', hint: 'פוסטים אחרונים', pro: true },
            { tone: 'sky', label: 'שאלות נפוצות', pro: true },
            { tone: 'plum', label: 'יצירת קשר', hint: 'טופס + פרטים' },
          ]}
        />
      </AboutSection>

      <AboutSection
        icon={<Settings className="h-5 w-5" />}
        title="כל טאב מזין חלק אחר באתר"
        subtitle="מה שממלאים בכל טאב בקבוצת ״ניהול אתר ציבורי״ הוא מה שמופיע באתר."
      >
        <TabSectionMap
          rows={[
            {
              icon: <ImageIcon className="h-4 w-4" />,
              tab: 'גלריות ציבוריות',
              section: 'סקשן תיק העבודות',
            },
            {
              icon: <FileText className="h-4 w-4" />,
              tab: 'פוסטים',
              section: 'הבלוג ודף הבית',
            },
            {
              icon: <Package className="h-4 w-4" />,
              tab: 'חבילות צילום',
              section: 'סקשן החבילות',
            },
            {
              icon: <MessageSquareQuote className="h-4 w-4" />,
              tab: 'תגובות',
              section: 'סקשן ההמלצות',
            },
            {
              icon: <Images className="h-4 w-4" />,
              tab: 'לפני ואחרי עיבוד',
              section: 'סקשן לפני / אחרי',
            },
            {
              icon: <CircleHelp className="h-4 w-4" />,
              tab: 'שאלות נפוצות',
              section: 'סקשן השאלות',
            },
            {
              icon: <Mail className="h-4 w-4" />,
              tab: 'יצירת קשר',
              section: 'טופס יצירת הקשר',
            },
            {
              icon: <Settings className="h-4 w-4" />,
              tab: 'הגדרות אתר',
              section: 'ערכת עיצוב, כותרות, שפה, פרטי קשר',
            },
            {
              icon: <Globe className="h-4 w-4" />,
              tab: 'דומיין אישי',
              section: 'הכתובת של האתר',
            },
          ]}
        />
      </AboutSection>

      <Callout
        tone="violet"
        icon={<Lock className="h-5 w-5" />}
        title="מה דורש מנוי פרו"
      >
        פוסטים, חבילות, המלצות, לפני/אחרי, שאלות נפוצות ודומיין אישי — זמינים
        בפרו. תיק העבודות, הגדרות האתר ויצירת הקשר פתוחים בכל מסלול.
      </Callout>

      <AboutSection
        icon={<MonitorCheck className="h-5 w-5" />}
        title="איך מקימים אתר"
        subtitle="ארבעה צעדים עד שהאתר באוויר."
      >
        <AboutFlow
          steps={[
            {
              tone: 'plum',
              icon: <Globe className="h-5 w-5" />,
              title: 'בוחרת כתובת',
              caption: 'ה-slug של האתר. בלי כתובת האתר לא זמין לצפייה.',
            },
            {
              tone: 'sky',
              icon: <Palette className="h-5 w-5" />,
              title: 'בוחרת עיצוב וצבע',
              caption: 'ערכת עיצוב + צבע מותג, תחת ״הגדרות אתר״.',
            },
            {
              tone: 'amber',
              icon: <ImageIcon className="h-5 w-5" />,
              title: 'ממלאת תוכן',
              caption: 'תמונות רקע, גלריות, חבילות, שאלות ותשובות.',
            },
            {
              tone: 'emerald',
              icon: <Eye className="h-5 w-5" />,
              title: 'פותחת לצפייה',
              caption: 'מכבה את מצב ״בבנייה״ — והאתר פומבי.',
            },
          ]}
        />
      </AboutSection>

      <Callout
        tone="sky"
        icon={<Lock className="h-5 w-5" />}
        title="האתר הציבורי ≠ גלריות פרטיות"
      >
        האתר הציבורי פתוח לכולם ומיועד לשיווק. גלריה פרטית נשלחת ללקוח אחד
        ומוגנת.{' '}
        <Link
          href="/dashboard/about/private-galleries"
          className="font-semibold text-[#7D3A52] underline underline-offset-2"
        >
          על הגלריות הפרטיות
        </Link>
      </Callout>
    </>
  )
}
