import { getMarketingPrivateGalleryPricing, getMarketingProPricing } from '@/lib/payments/marketing-pricing'
import { fetchActiveGalleryPassBundles } from '@/lib/gallery-pass/loader'
import { CUSTOM_DOMAIN_ADDON_PRICE_ILS } from '@/lib/domains/custom-domain-addon'
import {
  FREE_GALLERY_PHOTO_LIMIT,
  FREE_HERO_IMAGE_LIMIT,
  FREE_PUBLIC_GALLERY_LIMIT,
  PRO_PUBLIC_GALLERY_LIMIT,
  PRO_PUBLIC_PHOTO_LIMIT,
} from '@/lib/subscriptions/entitlements'

// On-demand knowledge base for Noa. The system prompt only carries the topic
// INDEX (KNOWLEDGE_INDEX); the full text is returned by the lookup_knowledge
// tool when she needs it, so it is not sent on every message.
//
// Facts here were verified against the code (client-gallery.actions.ts,
// gallery.actions.ts, lib/subscriptions/entitlements.ts, the private-gallery
// lifecycle plan). Numbers that live in the DB (plan prices, tier quotas, pass
// bundles) are fetched live by the async topics below — never hardcode them.
// Keep this file in sync when product behavior changes.

export const KNOWLEDGE_TOPICS = [
  'overview',
  'private_galleries',
  'private_gallery_client_access',
  'private_gallery_lifecycle',
  'private_gallery_plans',
  'netfree',
  'public_site',
  'pro_plan',
  'custom_domain',
  'navigation',
] as const

export type KnowledgeTopic = (typeof KNOWLEDGE_TOPICS)[number]

export const KNOWLEDGE_INDEX = `- overview — מה זה STG, שני המוצרים הנפרדים (אתר ציבורי / גלריות פרטיות)
- private_galleries — איך עובדת גלריית לקוח מקצה לקצה, מה מגדירים, סימן מים, הורדות
- private_gallery_client_access — איך הלקוח נכנס (קוד חד-פעמי במייל, אין סיסמה לבחור!)
- private_gallery_lifecycle — נעילה אחרי שליחה, 60 יום, מחיקה אוטומטית, השהיה
- private_gallery_plans — מסלולי גלריות פרטיות, מכסות, פאס בודד, מחירים (נטען חי)
- netfree — נטפרי וגלריות פרטיות: מה אמת ומה לא מובטח
- public_site — האתר הציבורי: סקשנים, ערכות עיצוב, כתובת, גוגל
- pro_plan — חינם מול PRO באתר הציבורי, מגבלות, מחירים (נטען חי)
- custom_domain — דומיין אישי
- navigation — שמות הטאבים בסרגל הצד ונתיבים`

const OVERVIEW = `STG (דומיין studio-galleries.com) היא פלטפורמה לצלמות/ים עם שני מוצרים נפרדים לגמרי, עם מינויים נפרדים שאינם קשורים זה לזה:
1. אתר ציבורי (אתר תדמית/תיק עבודות) — כתובת משלה, 4 ערכות עיצוב, גלריות ציבוריות, חבילות, בלוג, המלצות, שאלות נפוצות, יצירת קשר. מסלולי FREE / PRO.
2. גלריות פרטיות (גלריות לקוח) — גלריה אישית לכל לקוח לבחירת תמונות ומסירה. מסלולים משלהם (חינם / Starter / Pro / Unlimited) ופאס בודד.
חשוב: מסלול PRO של האתר הציבורי לא כולל גלריות פרטיות ולא משפיע עליהן. אלה שני מוצרים עם חיוב נפרד. "גלריה ציבורית" ו"גלריה פרטית" הן שני סוגים שאי אפשר להפוך אחד לשני.
בסרגל הצד יש שתי קבוצות: "ניהול גלריות פרטיות" ו"ניהול אתר ציבורי".`

const PRIVATE_GALLERIES = `גלריית לקוח (פרטית) — זרימה:
1. יוצרת גלריה בטאב "גלריות פרטיות" (אשף של 3 שלבים): בוחרת/יוצרת לקוח (שם, מייל, טלפון), נותנת שם לגלריה, תאריך תפוגה (אופציונלי, ברירת מחדל 60 יום מהשליחה), מסלולי בחירה, סימן מים, הרשאות הורדה.
2. מעלה את התמונות ושולחת ללקוח. הלקוח מקבל מייל עם קישור לגלריה שלו.
3. הלקוח נכנס (ראי private_gallery_client_access), רואה את התמונות בסימן מים ומסמן בעצמו על התמונה. יש שני מסלולי בחירה שאפשר להפעיל/לכבות בנפרד: "תמונות לאלבום" ו"תמונות לעיבוד", עם מכסה לכל אחד (ריק = ללא הגבלה).
4. הצלמת מורידה את הבחירה כ-ZIP באיכות מלאה (הקבצים עצמם, לא רשימת מספרים).
5. מעלה תמונות מעובדות בטאב "מעובדות" — הלקוח מקבל מייל ומוריד.
הגדרות לכל גלריה: שם ולקוח, תפוגה, מכסות בחירה, סימן מים (אוטומטי, עם טקסט מותאם), הרשאות הורדה (תצוגה / מקור).
עיצוב: אין "פריסת גריד/מצגת" ולא תמונת קאבר לגלריית לקוח. את מראה דף הלקוח (לוגו, סגנון כותרת, רקע, קישור לאתר) מעצבים בטאב "עיצוב גלריה פרטית" והוא חל על כל הגלריות.
סימן מים: הלקוח רואה גרסה מוקטנת (1200px) עם סימן מים, לעולם לא את המקור, עד שתמונה נמסרת בפועל כמעובדת. בכיבוי סימן המים מופיע דיאלוג אישור.
גלריה פרטית לא מופיעה באתר הציבורי ולא באינדקס גוגל.
מדריך מאויר: /dashboard/about/private-galleries`

const CLIENT_ACCESS = `איך הלקוח נכנס לגלריה — חשוב ומדויק:
- הצלמת לא בוחרת סיסמה לגלריה ואין סיסמאות לנהל. המערכת מייצרת סיסמה פנימית אוטומטית שאף אחד לא רואה.
- המייל עם הקישור לא מכיל קוד. הלקוח נכנס לקישור, ובדף הכניסה לוחץ לבקש קוד, ומקבל קוד בן 6 ספרות למייל שרשום אצל הצלמת על הלקוח.
- הקוד חד-פעמי: כל בקשה מחליפה את הקוד הקודם. מגבלה: 3 בקשות ב-15 דקות.
- אם ללקוח אין מייל במערכת — אי אפשר לבקש קוד. צריך להשלים מייל בטאב "לקוחות".
- אם הלקוח לא מקבל: לבדוק ספאם ושהמייל נכון, ולבקש קוד חדש.
- הכניסה חסומה אם הגלריה בטיוטה (טרם נשלחה), נסגרה, פגה, או הושהתה.
- כשצלמת צופה בגלריה שלה מהדשבורד היא נכנסת בלי קוד.`

const LIFECYCLE = `מחזור חיים של גלריית לקוח:
- שימוש אחד: בשליחה הראשונה ללקוח הגלריה ננעלת — אי אפשר להוסיף/למחוק/להחליף תמונות באלבום המקור, גם לא לצלמת. לפני השליחה יש דיאלוג אישור. תמונות מעובדות עדיין אפשר להעלות. מכסת התמונות ננעלת בשליחה.
- אורך חיים: 60 יום מהשליחה (אפשר לקצר לפני שליחה, לא להאריך). זה גם סוף גישת הלקוח וגם מועד המחיקה. אין כפתור הארכה; במקרים חריגים פונים לתמיכה. בפאס בודד אורך החיים הוא לפי החבילה.
- מחיקה אוטומטית: אחרי התפוגה הגלריה וכל קבציה נמחקים סופית. מיילי אזהרה לצלמת 14 יום, 3 ימים ויום לפני.
- פינוי מקום: מחיקת גלריה (ידנית או אוטומטית) פותחת מקום במכסת הגלריות במקביל.
- מנוי גלריות שנגמר: 15 ימי חסד, ואז כל גלריות הלקוח מושהות (גם הלקוח וגם הצלמת חסומים) עד חידוש. החידוש מפעיל מיד. שעון המחיקה ממשיך לרוץ.
- מסלול חינם: גלריה אחת במקביל, עד 400 תמונות, באותו מחזור חיים.
(גלריות שנשלחו לפני כניסת המודל לא נועלות ולא נמחקות אוטומטית.)`

const NETFREE = `נטפרי וגלריות פרטיות — אסור להבטיח:
- גלריות פרטיות מוגשות מתת-דומיין נפרד ומבודד (private.studio-galleries.com) שנוצר במיוחד כדי שסינון תמונות לא יחול עליו. נטפרי אישרו את התת-דומיין.
- אבל בפועל, נכון לבדיקות שנעשו, נטפרי עדיין עלול לסנן את התמונות עצמן אצל לקוחות (במקום תמונה מופיע "לבדיקת התמונה פנו לנטפרי"), בעיקר תמונות עם נשים. הנושא מול נטפרי טרם נפתר ותלוי בהגדרות הסינון שלהם. לא קוד בעיה אצלנו.
- לכן: אסור לומר "זה עובד בנטפרי" או "התמונות ייפתחו". לומר בכנות: הגלריות נבנו כך שיהיו ידידותיות לסינון, ואין התחייבות שהתמונות יוצגו בכל פרופיל נטפרי. כדאי לבדוק עם לקוח אחד לפני שמסתמכים, ואם מסתנן — לפנות לתמיכה.
- ההעלאה מצד הצלמת דורשת שהדומיין של האחסון (*.r2.cloudflarestorage.com) יהיה מותר בסינון שלה.
- האתר הציבורי והגלריות הציבוריות לא יושבים על התת-דומיין המבודד ועוברים סינון רגיל.`

const PUBLIC_SITE = `האתר הציבורי:
- כתובת: studio-galleries.com/<slug> (ה-slug בטאב "הגדרות אתר"; בלי slug האתר לא נגיש ולא בגוגל). אפשר להוסיף דומיין אישי.
- 4 ערכות עיצוב: קלאסי (קרם חם), מודרני, אלגנטי, נועז (כהה). בוחרים בהגדרות אתר, יחד עם צבע מותג, פונטים ולוגו.
- סקשנים: סקשן ראשי (הירו: תמונות/וידאו), אודות, גלריות ציבוריות, תמונות אחרונות, חבילות, המלצות, לפני/אחרי, בלוג/פוסטים, שאלות נפוצות, יצירת קשר. סקשן בלי תוכן לא מוצג. סדר דף הבית נקבע בטאב "סדר דף הבית".
- אפשר לשלוט מתי האתר עולה (מצב "בבנייה" / זמין). האתר מופיע בגוגל (SEO) ברגע שיש slug והוא פעיל.
- גלריה ציבורית: מוצגת באתר, בלי סיסמה. אפשר להסתיר/להציג בלי להפוך אותה לפרטית.
- מדריך מאויר: /dashboard/about/public-site`

async function buildProPlan(): Promise<string> {
  const pricing = await getMarketingProPricing()
  return `מסלולי האתר הציבורי:
FREE: עד ${FREE_HERO_IMAGE_LIMIT} תמונות הירו, גלריה ציבורית אחת מוצגת, עד ${FREE_GALLERY_PHOTO_LIMIT} תמונות בגלריה, ערכות עיצוב, אודות, יצירת קשר.
PRO: וידאו הירו, פוסטים/בלוג, המלצות, חבילות צילום, לפני/אחרי, שאלות נפוצות, עד ${PRO_PUBLIC_GALLERY_LIMIT} גלריות ציבוריות (עד ${PRO_PUBLIC_PHOTO_LIMIT} תמונות בסך הכל).
(דומיין אישי הוא רכישה חד-פעמית נפרדת, ראי custom_domain.)
מחירי PRO כרגע: חודשי ₪${pricing.monthlyPrice}${pricing.monthlyCompareAt ? ` (במקום ₪${pricing.monthlyCompareAt})` : ''}, שנתי ₪${pricing.yearlyPrice}${pricing.yearlyCompareAt ? ` (במקום ₪${pricing.yearlyCompareAt})` : ''}. ניתן להזכיר את המחירים הציבוריים האלה, לא פרטי חיוב אישיים.
PRO באתר הציבורי אינו כולל גלריות פרטיות ואינו מגדיל את מכסתן — זה מוצר ומינוי נפרד (private_gallery_plans).
שדרוג והמסלול הנוכחי: /dashboard/subscription`
}

async function buildPrivatePlans(): Promise<string> {
  const [pricing, bundles] = await Promise.all([
    getMarketingPrivateGalleryPricing(),
    fetchActiveGalleryPassBundles().catch(() => []),
  ])
  const paid = pricing.paid
    .map(
      (t) =>
        `- ${t.name}: ₪${t.price} לחודש, עד ${t.maxGalleries} גלריות במקביל, עד ${t.maxPhotosPerGallery} תמונות לגלריה`
    )
    .join('\n')
  const passes = bundles.length
    ? bundles
        .map(
          (b) =>
            `- ${b.name}: ₪${b.amount_agorot / 100}, עד ${b.photo_cap} תמונות, גישה ללקוח ${b.validity_days} ימים מהשליחה`
        )
        .join('\n')
    : '(אין כרגע חבילות פאס פעילות)'
  return `גלריות פרטיות הן מוצר נפרד ממסלול ה-PRO של האתר, עם מינוי משלו. מקור הנתונים חי מהמערכת:
חינם: ${pricing.free.maxGalleries} גלריה במקביל, עד ${pricing.free.maxPhotosPerGallery} תמונות לגלריה.
מסלולים בתשלום:
${paid}
פאס לגלריה בודדת (למי בלי מנוי): קונים חבילה בנפרד בטאב "חבילות שימוש", ואז יוצרים גלריה רגילה והקרדיט נצרך אוטומטית:
${passes}
פאס אינו ניתן לחידוש בתשלום; אחרי תום הימים הגלריה נחסמת ונמחקת.
מכסת התמונות נקבעת בשליחה ולא גדלה בדיעבד. ניהול והרכישה: /dashboard/usage-packages`
}

const CUSTOM_DOMAIN = `דומיין אישי: חיבור דומיין משלך (למשל www.השם-שלך.com) לאתר הציבורי במקום כתובת ה-slug. רכישה חד-פעמית של ₪${CUSTOM_DOMAIN_ADDON_PRICE_ILS}, בלתי תלויה במסלול ה-PRO. מגדירים בטאב "דומיין אישי": /dashboard/custom-domain`

const NAVIGATION = `סרגל הצד מחולק לשתי קבוצות.
ניהול גלריות פרטיות: לוח בקרה (/dashboard), לקוחות (/dashboard/clients), גלריות פרטיות (/dashboard/private-galleries), עיצוב גלריה פרטית (/dashboard/client-page-design), חבילות שימוש (/dashboard/usage-packages), אודות — גלריות פרטיות (/dashboard/about/private-galleries).
ניהול אתר ציבורי: הגדרות אתר (/dashboard/settings), סדר דף הבית (/dashboard/homepage-layout), סקשן ראשי (/dashboard/site-hero), סקשן אודות (/dashboard/site-about), גלריות ציבוריות (/dashboard/galleries), פוסטים (/dashboard/posts), חבילות צילום (/dashboard/packages), תגובות (/dashboard/reviews), לפני ואחרי עיבוד (/dashboard/photo-edits), שאלות נפוצות (/dashboard/faq), דומיין אישי (/dashboard/custom-domain), מינוי (/dashboard/subscription), יצירת קשר (/dashboard/contact), אודות — האתר הציבורי (/dashboard/about/public-site).
יצירת גלריית לקוח חדשה: /dashboard/galleries/new?kind=client`

const STATIC_TOPICS: Record<string, string> = {
  overview: OVERVIEW,
  private_galleries: PRIVATE_GALLERIES,
  private_gallery_client_access: CLIENT_ACCESS,
  private_gallery_lifecycle: LIFECYCLE,
  netfree: NETFREE,
  public_site: PUBLIC_SITE,
  custom_domain: CUSTOM_DOMAIN,
  navigation: NAVIGATION,
}

export async function lookupKnowledge(topic: string): Promise<string> {
  if (topic === 'pro_plan') return buildProPlan()
  if (topic === 'private_gallery_plans') return buildPrivatePlans()
  return STATIC_TOPICS[topic] ?? `נושא לא מוכר. נושאים זמינים: ${KNOWLEDGE_TOPICS.join(', ')}`
}

export const LOOKUP_KNOWLEDGE_TOOL = {
  name: 'lookup_knowledge',
  description:
    'שליפת מידע מדויק ועדכני על המערכת (איך גלריות פרטיות עובדות, כניסת לקוח, מסלולים, נטפרי, ניווט ועוד). חובה לקרוא לכלי הזה לפני כל תשובה עובדתית על איך המערכת עובדת, מה כלול במסלול או כמה זה עולה — ולא לענות מהזיכרון.',
  input_schema: {
    type: 'object' as const,
    properties: {
      topic: { type: 'string', enum: [...KNOWLEDGE_TOPICS], description: 'הנושא לשליפה' },
    },
    required: ['topic'],
  },
}
