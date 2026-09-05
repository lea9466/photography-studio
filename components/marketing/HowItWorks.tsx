import {
  Download,
  Eye,
  FolderPlus,
  Globe,
  Image as ImageIcon,
  Lock,
  MousePointerClick,
  Palette,
  Rocket,
  Send,
  Wand2,
} from 'lucide-react'
import { Reveal } from '@/components/marketing/Reveal'
import { GuideFlow } from '@/components/shared/guide/GuideFlow'

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-[--border] px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">איך זה עובד</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-[--muted]">
            שני מוצרים נפרדים, שני תהליכים פשוטים — אפשר להתחיל מכל אחד מהם.
          </p>
        </Reveal>

        <Reveal className="mt-14">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Globe className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold">הקמת אתר תדמית</h3>
          </div>
          <GuideFlow
            variant="violet"
            steps={[
              {
                tone: 'accent',
                icon: <Globe className="h-5 w-5" />,
                title: 'בוחרת כתובת',
                caption: 'כתובת קצרה לאתר — למשל שם הסטודיו שלך.',
              },
              {
                tone: 'sky',
                icon: <Palette className="h-5 w-5" />,
                title: 'עיצוב וצבע',
                caption: 'ערכת נושא וצבע מותג — בלי קוד ובלי מעצב.',
              },
              {
                tone: 'amber',
                icon: <ImageIcon className="h-5 w-5" />,
                title: 'ממלאת תוכן',
                caption: 'תמונות, גלריות וחבילות — והאתר מתעדכן בזמן אמת.',
              },
              {
                tone: 'emerald',
                icon: <Rocket className="h-5 w-5" />,
                title: 'עולה לאוויר',
                caption: 'מפרסמת, והאתר מופיע בגוגל עם השם שלך.',
              },
            ]}
          />
        </Reveal>

        <Reveal className="mt-14">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Lock className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold">גלריה פרטית מול לקוח</h3>
          </div>
          <GuideFlow
            variant="violet"
            steps={[
              {
                tone: 'accent',
                icon: <FolderPlus className="h-5 w-5" />,
                title: 'יוצרת גלריה',
                caption: 'משייכת ללקוח, קובעת תפוגה ומכסת בחירה.',
              },
              {
                tone: 'sky',
                icon: <Send className="h-5 w-5" />,
                title: 'שולחת קישור',
                caption: 'הלקוח מקבל מייל עם גלריה פרטית משלו.',
              },
              {
                tone: 'violet',
                icon: <MousePointerClick className="h-5 w-5" />,
                title: 'הלקוח בוחר',
                caption: 'מסמן על התמונה עצמה — בלי רשימות מספרים.',
              },
              {
                tone: 'amber',
                icon: <Download className="h-5 w-5" />,
                title: 'מורידה נבחרות',
                caption: 'ZIP בקבצים מלאים, מסודר לאלבום ולעיבוד.',
              },
              {
                tone: 'emerald',
                icon: <Wand2 className="h-5 w-5" />,
                title: 'מוסרת מעובדות',
                caption: 'מעלה את המוכנות, הלקוח מוריד את כולן בקליק.',
              },
            ]}
          />
        </Reveal>
      </div>
    </section>
  )
}
