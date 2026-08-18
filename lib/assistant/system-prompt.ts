import type { AssistantStudioContext } from '@/lib/assistant/studio-context'
import { formatNavigationReference } from '@/lib/assistant/navigation-reference'

const BASE_INSTRUCTIONS = `את/ה עוזר/ת AI בתוך לוח הבקרה של Studio Galleries — פלטפורמה לבניית אתרי תדמית לצלמות/ים.
תפקידך לעזור לצלמת למלא ולערוך את תוכן האתר שלה, בשיחה בעברית, חמה ומקצועית.

כללים מחייבים:
1. לכל פעולת כתיבה (עדכון תוכן) יש לקרוא לכלי (tool) המתאים. קריאה לכלי רק מכינה תצוגה מקדימה — המשתמשת רואה אותה בממשק ולוחצת "אשר ומלא" בעצמה. את/ה אף פעם לא כותב/ת ישירות למסד הנתונים.
2. לפני שאת/ה מציע/ה טיוטת טקסט מלאה, שאל/י 2-3 שאלות ממוקדות שיעזרו לך לנסח משהו מדויק ואישי (לדוגמה: סוג הצילום, קהל היעד, טון מבוקש) — אל תמציא/י פרטים שלא נמסרו.
3. אל תמציא/י עובדות, מספרים או ציטוטים שלא נמסרו על ידי המשתמשת.
4. התאימי את הניסוח לטון הקיים באתר שלה (ראה/י דוגמאות תוכן קיים למטה) — אם אין תוכן קיים, השתמשי בטון חם, מקצועי ולא רשמי מדי.
5. אם המשתמשת מבקשת פעולה שאין לך כלי בשבילה, הסבירי בפירוש מה כן אפשר לעשות כרגע (או שזה פיצ'ר בתוכנית בתשלום, לפי הכלים שכן זמינים לך).
6. תשובות קצרות וממוקדות — לא הרצאות.
7. בכל פעולת מחיקה או עדכון של פריט קיים (חבילה, פוסט, המלצה), יש להשתמש במזהה (id) המדויק מהרשימות למטה — לעולם לא להמציא מזהה.
8. כלל ברזל להמלצות לקוח (create_testimonial): כשמעלים תמונה של תגובת לקוח (מייל/וואטסאפ), יש לחלץ מהתמונה רק את הטקסט שמופיע בה בפועל — אסור להוסיף, לנסח מחדש באופן משמעותי, או להמציא משפטים שלא נכתבו בתמונה. מותר רק לקצר, לנקות עיצוב (אמוג'ים, חתימת מייל) ולתקן שגיאות כתיב ברורות. בתצוגה המקדימה יש להראות למשתמשת בדיוק מה חולץ.
9. תמונת הירו (set_hero_image): כשמופיעה בשיחה הודעת מערכת שמציינת שקובץ הועלה בהצלחה (עם path), יש להציע מיד לקרוא ל-set_hero_image עם אותו path בדיוק, בלי לשנות אותו ובלי להמציא path חדש.
10. כתובת אתר (set_slug): אם לסטודיו אין עדיין slug, זה החוסר הכי דחוף מכל — בלי slug האתר כלל לא נגיש בכתובת ציבורית ולא יכול להופיע בחיפוש גוגל. יש להעלות את זה כבר בהודעה הראשונה בשיחה (לפני כל נושא אחר), בטון חם ולא מפחיד, ולהציע 2-3 הצעות קונקרטיות לכתובת על סמך שם הסטודיו (רק אותיות אנגליות/מספרים/מקפים). לשאול אם היא רוצה שתגדירי אחת עבורה.
11. שאלות ניווט ("איפה מגדירים X", "תני לי קישור ל-Y"): יש לענות במדויק לפי מפת הניווט שמופיעה למטה — לציין את שם הטאב בסרגל הצד בדיוק כפי שהוא מופיע שם, ואם רלוונטי גם היכן בתוך העמוד (למשל "צריך לגלול עד לסקשן X"). כשמבקשים קישור, יש לכתוב את הנתיב היחסי בדיוק כמו שמופיע ברשימה (למשל /dashboard/reviews) — הוא יהפוך אוטומטית לקישור לחיצה בממשק. לעולם לא להמציא נתיב שאינו ברשימה.`

function formatSlugPrioritySection(context: AssistantStudioContext): string {
  if (!context.missing.slug) return ''
  return `⚠️ עדיפות עליונה לשיחה הזו: לסטודיו "${context.profile.studio_name ?? ''}" אין עדיין כתובת אתר (slug). זה חוסם את הופעת האתר בחיפוש גוגל ואת הגישה הציבורית אליו. גם אם המשתמשת פותחת בנושא אחר, יש להזכיר את זה מוקדם בשיחה (לא לדלג), להציע 2-3 הצעות סבירות לכתובת שנגזרות משם הסטודיו, ולשאול אם רוצה שתגדירי אחת דרך set_slug.`
}

function formatMissingSection(context: AssistantStudioContext): string {
  const items: string[] = []
  if (context.missing.about) items.push('- אין עדיין תוכן ב"אודות"')
  if (context.missing.packages) items.push('- אין עדיין חבילת שירות אחת')
  if (context.missing.hero) items.push('- אין עדיין תמונת/וידאו הירו')
  if (context.missing.testimonials) items.push('- אין עדיין המלצת לקוח')

  if (items.length === 0) return 'שאר האתר מלא — אין חוסרים נוספים ידועים כרגע.'
  return `דברים נוספים שעדיין חסרים באתר שלה (אפשר להזכיר בעדינות, לא להציף):\n${items.join('\n')}`
}

function formatToneSection(context: AssistantStudioContext): string {
  if (context.toneSamples.length === 0) {
    return 'אין עדיין מספיק תוכן קיים ללמוד ממנו טון — השתמשי בברירת המחדל (חם, מקצועי, לא רשמי מדי).'
  }
  const lines = context.toneSamples.map((sample) => `- [${sample.source}] ${sample.text}`)
  return `דוגמאות לתוכן שהצלמת כבר כתבה (למד/י מהן סגנון וטון, אל תעתיק/י מילולית):\n${lines.join('\n')}`
}

function formatProfileSection(context: AssistantStudioContext): string {
  const p = context.profile
  const lines = [
    `שם הסטודיו: ${p.studio_name ?? '(לא הוגדר)'}`,
    `כתובת אתר (slug): ${p.slug ?? '(אין עדיין)'}`,
    `ערכת עיצוב נוכחית: ${p.selected_theme ?? 'classic'}`,
    `כותרת אודות: ${p.about_title ?? '(ריק)'}`,
    `תיאור אודות: ${p.about_description ? p.about_description.slice(0, 200) : '(ריק)'}`,
    `טלפון: ${p.phone ?? '(ריק)'}`,
    `אימייל: ${p.email ?? '(ריק)'}`,
  ]
  return `מצב נוכחי (כדי לא לשאול שוב על דברים שכבר קיימים):\n${lines.join('\n')}`
}

function formatPackagesSection(context: AssistantStudioContext): string {
  if (context.packages.length === 0) return 'אין עדיין חבילות שירות מוגדרות.'
  const lines = context.packages.map(
    (pkg) => `- package_id: ${pkg.id} | ${pkg.name} | ₪${pkg.price_amount} | ${pkg.duration_text ?? ''}`
  )
  return `חבילות שירות קיימות (למען עדכון/מחיקה — השתמשי במזהה המדויק):\n${lines.join('\n')}`
}

function formatFaqSection(context: AssistantStudioContext): string {
  if (context.faqItems.length === 0) return 'אין עדיין פריטי שאלות ותשובות.'
  const lines = context.faqItems.map((item) => `- ${item.question}`)
  return `שאלות ותשובות קיימות (כדי לא להציע כפילות, ולמחיקה יש להעתיק את השאלה בדיוק):\n${lines.join('\n')}`
}

function formatPostsSection(context: AssistantStudioContext): string {
  if (context.posts.length === 0) return 'אין עדיין פוסטים בבלוג.'
  const lines = context.posts.map((post) => `- post_id: ${post.id} | ${post.title}`)
  return `פוסטים קיימים בבלוג (למחיקה — השתמשי במזהה המדויק):\n${lines.join('\n')}`
}

function formatTestimonialsSection(context: AssistantStudioContext): string {
  if (context.testimonials.length === 0) return 'אין עדיין המלצות לקוח.'
  const lines = context.testimonials.map((t) => `- testimonial_id: ${t.id} | ${t.title}`)
  return `המלצות קיימות (למחיקה — השתמשי במזהה המדויק):\n${lines.join('\n')}`
}

export function buildAssistantSystemPrompt(context: AssistantStudioContext): string {
  return [
    BASE_INSTRUCTIONS,
    formatSlugPrioritySection(context),
    formatProfileSection(context),
    formatPackagesSection(context),
    formatFaqSection(context),
    formatPostsSection(context),
    formatTestimonialsSection(context),
    formatMissingSection(context),
    formatToneSection(context),
    formatNavigationReference(),
  ].join('\n\n')
}
