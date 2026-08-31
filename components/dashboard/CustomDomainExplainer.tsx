import { Fingerprint, Search, ShieldCheck, ShoppingBag, Link2, KeySquare, CheckCircle2, MessageCircle, Clock } from 'lucide-react'

const BENEFITS = [
  {
    icon: Fingerprint,
    title: 'זהות מקצועית וייחודית',
    text: 'האתר שלך יופיע בכתובת שלך — לא ב-slug תחת studio-galleries.com. הרבה יותר קל לזכור, לשווק ולשים על כרטיס ביקור.',
  },
  {
    icon: Search,
    title: 'עיגול ייחודי בתוצאות החיפוש',
    text: 'ה"עיגול" הוא הסמלון הקטן (favicon) שגוגל מציג ליד שם האתר בתוצאות חיפוש. גוגל מציג עיגול אחד בלבד לכל דומיין — כך שכל עוד את תחת studio-galleries.com/slug, מופיע העיגול הכללי של הפלטפורמה ולא הלוגו שלך.',
  },
  {
    icon: ShieldCheck,
    title: 'אמון גבוה יותר אצל לקוחות',
    text: 'כתובת אישית משדרת עסק מבוסס ורציני — לא עוד "אתר על פלטפורמה".',
  },
]

function GoogleResultPreview() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 rounded-xl border border-[--border]/70 bg-white p-4">
        <p className="text-xs font-medium text-[--muted]">היום — כתובת ה-slug</p>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white">
            S
          </span>
          <span dir="ltr" className="truncate text-xs text-[--muted]">studio-galleries.com/your-slug</span>
        </div>
        <p className="text-sm font-medium text-blue-700">שם הסטודיו שלך</p>
        <p className="text-xs text-[--muted]">אותו עיגול אפור בדיוק כמו אצל כל צלמת אחרת בפלטפורמה.</p>
      </div>
      <div className="space-y-2 rounded-xl border border-[#7D3A52]/30 bg-white p-4">
        <p className="text-xs font-medium text-[--muted]">עם דומיין אישי</p>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7D3A52] text-[10px] font-bold text-white">
            ✦
          </span>
          <span dir="ltr" className="truncate text-xs text-[--muted]">your-own-domain.com</span>
        </div>
        <p className="text-sm font-medium text-blue-700">שם הסטודיו שלך</p>
        <p className="text-xs text-[--muted]">עיגול ייחודי עם הלוגו שלך — לא של הפלטפורמה.</p>
      </div>
    </div>
  )
}

function DnsRecordPreview() {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[--border]/70">
      <div className="flex items-center gap-1.5 border-b border-[--border]/70 bg-[--dashboard-surface] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="mr-2 text-xs text-[--muted]">כך בערך תיראה טבלת ה-DNS אצל ספק הדומיין</span>
      </div>
      <div className="grid grid-cols-3 bg-white/80 text-xs font-semibold text-[--muted]">
        <div className="border-b border-[--border]/60 px-4 py-2">Type</div>
        <div className="border-b border-[--border]/60 px-4 py-2">Name / Host</div>
        <div className="border-b border-[--border]/60 px-4 py-2">Value</div>
      </div>
      <div dir="ltr" className="grid grid-cols-3 bg-white text-sm text-[--foreground]">
        <div className="border-b border-[--border]/40 px-4 py-2.5 font-mono">CNAME</div>
        <div className="border-b border-[--border]/40 px-4 py-2.5 font-mono">www</div>
        <div className="border-b border-[--border]/40 px-4 py-2.5 font-mono truncate">cname.vercel-dns.com</div>
        <div className="px-4 py-2.5 font-mono">A</div>
        <div className="px-4 py-2.5 font-mono">@</div>
        <div className="px-4 py-2.5 font-mono">76.76.21.21</div>
      </div>
    </div>
  )
}

const STEPS = [
  {
    icon: ShoppingBag,
    title: 'קונים דומיין',
    text: 'אצל כל ספק דומיינים שתבחרי — עולה בדרך כלל בסביבות 50–100 ₪ לשנה.',
  },
  {
    icon: Link2,
    title: 'מזינות אותו כאן',
    text: 'מדביקים את הדומיין בטופס שלמטה ולוחצים "חברי דומיין". מיד יופיעו כאן בעמוד ההוראות המדויקות בשבילך.',
  },
  {
    icon: KeySquare,
    title: 'מוכיחות בעלות',
    text: 'מוסיפות רשומה אחת (שקיבלת כאן) בפאנל הניהול אצל ספק הדומיין — זו הדרך שמוכיחה שהדומיין באמת שלך. לוקח כמה דקות להזין, ועד כמה שעות עד שזה נכנס לתוקף בעולם.',
    extra: <DnsRecordPreview />,
  },
  {
    icon: CheckCircle2,
    title: 'האתר עולה',
    text: 'לוחצות "בדקי סטטוס" — ברגע שהאימות מסתיים, האתר שלך זמין בכתובת האישית שלך, עם אבטחה (SSL) מלאה.',
  },
]

export function CustomDomainExplainer() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-[--muted]">
        <span className="font-semibold text-[--foreground]">מה זה בכלל דומיין?</span> זו הכתובת הייחודית של אתר
        באינטרנט — למשל <span dir="ltr">google.com</span> או <span dir="ltr">nike.com</span>. זו הכתובת שמקלידים
        בדפדפן כדי להגיע לאתר, וזו הכתובת שמופיעה בתוצאות חיפוש בגוגל. כרגע האתר שלך יושב תחת כתובת של הפלטפורמה
        (<span dir="ltr">studio-galleries.com/{'{'}slug{'}'}</span>) — דומיין אישי נותן לך כתובת עצמאית משלך, כמו
        לכל עסק אמיתי.
      </p>

      <section className="relative space-y-5 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8">
        <h2 className="text-lg font-semibold text-[--foreground]">למה כדאי לחבר דומיין אישי?</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="space-y-2.5 rounded-xl border border-[--border]/60 bg-white/70 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[--foreground]">{title}</p>
              <p className="text-sm leading-relaxed text-[--muted]">{text}</p>
            </div>
          ))}
        </div>
        <GoogleResultPreview />
      </section>

      <section className="relative space-y-6 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8">
        <h2 className="text-xl font-semibold text-[--foreground]">איך זה עובד — 4 שלבים</h2>
        <ol className="space-y-6">
          {STEPS.map(({ icon: Icon, title, text, extra }, index) => (
            <li
              key={title}
              className="flex gap-5 rounded-xl border border-[--border]/60 bg-white/70 p-5 md:p-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7D3A52] text-base font-bold text-white">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 shrink-0 text-[#7D3A52]" aria-hidden />
                  <p className="text-base font-semibold text-[--foreground]">{title}</p>
                </div>
                <p className="text-base leading-relaxed text-[--muted]">{text}</p>
                {extra}
              </div>
            </li>
          ))}
        </ol>
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
          <Clock className="h-5 w-5 shrink-0 text-blue-700" />
          <p className="text-sm leading-relaxed text-blue-900">
            <span className="font-semibold">חשוב לדעת — זה לא קורה מיידית:</span> אחרי שהאתר עולה בדומיין האישי, לוקח
            לגוגל בדרך כלל <span className="font-semibold">שבועות עד חודשיים</span> להעביר את תוצאות החיפוש לכתובת
            החדשה. בינתיים, האתר שלך עשוי להמשיך להופיע בגוגל עם כתובת ה-slug הישנה (studio-galleries.com/slug) —
            זה תקין וצפוי, ושתי הכתובות ממשיכות לעבוד במקביל בלי בעיה.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-[#7D3A52]/20 bg-[#7D3A52]/[0.04] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-[--foreground]">לא בטוחה שתסתדרי לבד עם ההגדרות הטכניות?</h3>
            <p className="text-sm leading-relaxed text-[--muted]">
              קודם כול — כדאי לנסות לבד עם עזרה מ-AI: מצלמות מסך (screenshot) של עמוד ה-DNS אצל ספק הדומיין,
              מדביקות אותו בצ׳אט עם ג׳מיני או ChatGPT ומבקשות שיעזרו לך למלא את הרשומה הנכונה. ברוב המקרים זה
              עובד מצוין.
            </p>
            <p className="text-sm leading-relaxed text-[--muted]">
              עדיין תקועה? אני כאן — אני יכולה ללוות אותך אישית בכל התהליך, מהקנייה ועד שהאתר עולה, בעלות
              חד-פעמית של <span className="font-semibold text-[--foreground]">₪89</span>.
            </p>
            <a
              href="/dashboard/contact"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7D3A52] underline underline-offset-2 hover:text-[#5f2c40]"
            >
              לתיאום ליווי — יצירת קשר
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
