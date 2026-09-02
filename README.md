# Studio Galleries

פלטפורמת SaaS לצלמים: אתר תדמית ציבורי לכל צלם/סטודיו (דף נחיתה בכתובת `/[slug]`), ניהול גלריות תמונות ללקוחות (ציבוריות ופרטיות עם הגנת סיסמה), תיק עבודות (פורטפוליו), בלוג, "לפני/אחרי", חבילות שירות, המלצות לקוחות, מותג אישי (לוגו/צבעים/פונטים), ומערכת מנויים בתשלום.

נבנה עם Next.js 15 (App Router, React 19), Supabase (Postgres + Auth + RLS), ואחסון מדיה ב-Cloudflare R2. ממשק המשתמש בעברית ו-RTL לאורך כל האתר.

---

## תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [ארכיטקטורה וטכנולוגיות](#ארכיטקטורה-וטכנולוגיות)
3. [מבנה התיקיות](#מבנה-התיקיות)
4. [דומיינים עסקיים עיקריים](#דומיינים-עסקיים-עיקריים)
5. [מסד הנתונים (Supabase)](#מסד-הנתונים-supabase)
6. [משתני סביבה](#משתני-סביבה)
7. [התקנה והרצה מקומית](#התקנה-והרצה-מקומית)
8. [סקריפטים זמינים](#סקריפטים-זמינים)
9. [בדיקות (Testing)](#בדיקות-testing)
10. [אבטחה](#אבטחה)
11. [Cron Jobs ומשימות רקע](#cron-jobs-ומשימות-רקע)
12. [Deploy](#deploy)
13. [מוסכמות פיתוח](#מוסכמות-פיתוח)

---

## סקירה כללית

כל צלם/סטודיו מקבל:

- **אתר תדמית ציבורי** בכתובת `studio-galleries.com/<slug>` הכולל: עמוד בית עם תבנית עיצוב לבחירה (Classic / Modern / Elegant / Dark), תיק עבודות (`/portfolio`), בלוג (`/blog`), עמודי "לפני ואחרי" (`/before-after`), חבילות שירות, המלצות, טופס יצירת קשר ומפת SEO (`/seo-map`).
- **דשבורד ניהול** (`/dashboard`) לניהול גלריות, לקוחות, חבילות, פוסטים, המלצות, מותג (branding), הגדרות, ומנוי.
- **גלריות תמונות ללקוחות** — ציבוריות (`/[slug]/portfolio` וכו') או **פרטיות** בכתובת מבודדת לחלוטין תחת סאב-דומיין נפרד (`/g/[id]`), עם הגנת סיסמה, כדי לעמוד בהתחייבות מול ספק סינון תוכן שגלריות פרטיות "חיות" רק שם ולא מוגשות מהדומיין הראשי.
- **מערכת מנויים בתשלום** (trial → מנוי חודשי/שנתי) עם שכבת תשלומים ניטרלית-ספק (provider-neutral) התומכת ב-PayMe ו-SUMIT כמתאמים (adapters).
- **פאנל ניהול פנימי** (`/manage`) לצוות התפעול: שידורי הודעות, ניהול תוכניות מחיר, ניקוי קבצים יתומים, חיפוש משתמשים ועוד.

---

## ארכיטקטורה וטכנולוגיות

| שכבה | טכנולוגיה |
|---|---|
| Framework | Next.js 15.3 (App Router, Server Actions, Server Components) |
| UI | React 19, Tailwind CSS v4, shadcn/ui ("new-york" style), Radix UI, lucide-react |
| מסד נתונים / Auth | Supabase (Postgres, Row Level Security, Supabase Auth, `@supabase/ssr`) |
| אחסון מדיה | Cloudflare R2 (S3-compatible, דרך `@aws-sdk/client-s3`) |
| תשלומים | שכבת `PaymentService` ניטרלית-ספק, מתאמים ל-PayMe ו-SUMIT |
| דוא"ל | Resend |
| עיבוד תמונות | `sharp` (שרת), `browser-image-compression` (לקוח) |
| וידאו | `mp4box` (בדיקות/מטא-דאטה לווידאו הירו) |
| גרירה ושחרור | `@dnd-kit` (סידור תמונות/גלריות) |
| ולידציה | Zod |
| בדיקות | `node --test` / `tsx --test`, סקריפטים ייעודיים תחת `scripts/` |
| Deploy | Vercel (כולל Vercel Cron) |

עקרונות מפתח:

- **Server-first**: רוב הלוגיקה העסקית רצה בשרת (Server Actions תחת `lib/actions`, Route Handlers תחת `app/api`), עם הרשאות Supabase (Service Role) המוגבלות למודולי שרת בלבד.
- **RLS בכל מקום**: כל טבלה במסד מוגנת ב-Row Level Security; לקוחות (anon/authenticated) לא יכולים לקרוא/לכתוב מעבר למה שהם אמורים לראות.
- **בידוד גלריות פרטיות**: `middleware.ts` אוכף שדומיין הגלריה הפרטית (`NEXT_PUBLIC_PRIVATE_GALLERY_URL`) מגיש *רק* את הנתיבים `/g/*`, `/api/gallery-media`, ו-`/_next/*` — כל דבר אחר מקבל 404, וקישורים ישנים לגלריה מהדומיין הראשי מבצעים redirect 308 לדומיין המבודד.
- **Fail-closed בתשלומים**: אינטגרציית PayMe נבנתה כ"פיגום" (scaffolding) שנכשל בכוונה (`provider_not_configured`) עד שפרטי החוזה הרשמי מול הספק מאומתים; שום הפעלת מנוי לא קורית בלי webhook מאומת. ראו [`docs/payments-architecture.md`](docs/payments-architecture.md).
- **Feature Flags מחמירים**: דגלים כמו `PAYMENTS_CHECKOUT_ENABLED`, `TRIAL_ENDING_REMINDERS_ENABLED`, `ENFORCE_SUBSCRIPTION_ACCESS` נדלקים רק במחרוזת המדויקת `"true"`.

---

## מבנה התיקיות

```
app/
├── (auth)/              # התחברות, הרשמה, שכחתי סיסמה, איפוס סיסמה
├── [slug]/              # אתר התדמית הציבורי של כל צלם (עמוד בית, פורטפוליו, בלוג, לפני/אחרי, seo-map)
├── g/[id]/               # גלריית לקוח פרטית — מוגשת מדומיין מבודד בלבד
├── dashboard/            # פאנל ניהול הצלם: גלריות, לקוחות, חבילות, פוסטים, המלצות, מותג, הגדרות, מנוי
├── manage/               # פאנל ניהול פנימי לצוות (admin)
├── portfolio/            # דפי תיק עבודות ציבוריים
├── public-gallery/       # רכיבי תמיכה לגלריה ציבורית
├── accessibility/        # הצהרת נגישות
├── privacy/ terms/       # מסמכים משפטיים
├── api/                  # Route Handlers (תשלומים, מדיה, אדמין, cron, testimonials וכו')
├── layout.tsx, page.tsx  # שורש האפליקציה, עמוד הבית
├── sitemap.ts, robots.ts # SEO
└── icon.tsx, apple-icon.tsx

lib/
├── actions/              # Server Actions (auth ועוד)
├── payments/              # שכבת תשלומים ניטרלית-ספק + providers/payme, providers/sumit
├── subscriptions/          # entitlements, guard, gallery-gate — מי רשאי לגשת למה
├── trial/                  # תזכורות/התראות תקופת ניסיון
├── r2/                     # קליינט, קונפיגורציה ומפתחות ל-Cloudflare R2
├── supabase/               # קליינטים (client/server/admin/middleware)
├── homepage-themes/        # 4 תבניות עיצוב לעמוד הבית (classic, modern, elegant, dark)
├── mappers/, queries/, validations/, types/  # שכבת גישה לנתונים וטיפוסים
├── gallery-*.ts             # הרשאות, סיסמאות, סשן, מגבלות תמונות, בחירת תמונות
├── media-upload-pipeline.ts, hero-video*.ts  # צנרת העלאת מדיה ווידאו הירו
├── seo/                     # מטא-דאטה ציבורי ל-SEO
├── email/                   # שליחת מיילים (Resend)
├── cron/                    # הרשאת קריאות cron
├── referral/                # מנגנון הפניות
└── site-access/, site-gate  # שערי גישה לאתר

components/
├── admin/                # פאנל ניהול פנימי
├── auth/                 # טפסי התחברות/הרשמה
├── dashboard/             # רכיבי דשבורד הצלם
├── gallery/               # רכיבי גלריה (העלאה, סידור, הורדה כ-ZIP וכו')
├── marketing/             # עמוד השיווק/נחיתה של המוצר עצמו
├── photographer/          # PhotographerHomepage — הרכבת עמוד הבית הציבורי
├── public-site/           # רכיבי האתר הציבורי (פורטפוליו, בלוג וכו')
├── seo/                   # רכיבי מטא/structured data
├── site-gate/             # שערי הגנה (סיסמה וכו')
└── ui/                    # shadcn/ui primitives

supabase/
├── migrations/            # מיגרציות SQL (75+), הסכמה המלאה נבנית מהן
├── sql/                   # שאילתות/פונקציות עזר
├── seed.sql
└── config.toml

scripts/                  # סקריפטי CLI: בדיקות, אבחון, exploit/regression runners, ניהול auth redirect URLs
docs/                     # תיעוד ארכיטקטורה (payments-architecture.md)
```

---

## דומיינים עסקיים עיקריים

### אתר תדמית ציבורי (`/[slug]`)
עמוד הבית נבנה מ-4 תבניות עיצוב חלופיות (`lib/homepage-themes/{classic,modern,elegant,dark}.ts`), מורכב על ידי `components/photographer/PhotographerHomepage.tsx`. כולל הירו (תמונה/וידאו), חבילות שירות, גלריית תמונות אחרונות, פוסטים, המלצות, טופס יצירת קשר, ומיתוג אישי (`lib/branding-*`).

### גלריות
- **ציבוריות** — נגישות תחת דומיין הצלם, בונות HTML ציבורי (`lib/public-gallery-html.ts`).
- **פרטיות** (`/g/[id]`) — מוגנות סיסמה (`lib/gallery-password*.ts`), עם סשן ייעודי (`lib/gallery-session.ts`), ומוגשות אך ורק מדומיין מבודד (`NEXT_PUBLIC_PRIVATE_GALLERY_URL`) כפי שנאכף ב-`middleware.ts`. תמיכה בהורדת אלבום כ-ZIP בצד לקוח (`lib/client-zip-download.ts`) וסידור/בחירת תמונות (`gallery-selection.ts`, `@dnd-kit`).

### מדיה
- העלאה דרך `lib/media-upload-pipeline.ts` עם דחיסה בצד לקוח (`browser-image-compression`) ועיבוד בצד שרת (`sharp`).
- אחסון בפועל ב-Cloudflare R2 (`lib/r2/`), עם proxy ל-`/api/gallery-media` עבור מדיה בגלריות פרטיות (כדי לא לחשוף קישורי R2 ישירים).
- וידאו הירו לעמוד הבית: הגבלות (`hero-video-constraints.ts`), זמינות (`hero-video-availability.ts`) והעלאה (`hero-video-upload.ts`, `hero-video.server.ts`).

### תשלומים ומנויים
שכבת `lib/payments/` ניטרלית-ספק:

- `PaymentService` — נקודת הכניסה היחידה מה-UI/Server Actions; **אף קוד לקוח לא קורא ישירות לספק תשלומים**.
- `provider-factory.ts` בוחר מתאם לפי `PAYMENT_PROVIDER` (`providers/payme`, `providers/sumit`).
- Webhooks מאומתים בלבד מעדכנים מצב פיננסי — redirect מ-checkout לבדו **לעולם לא** מפעיל מנוי.
- `payment_webhook_events` משמש כתיבת "inbox" אטומית (`claim_payment_webhook_event`) שמבטיחה עיבוד יחיד לכל אירוע, כולל טיפול ב-duplicate delivery.
- `lib/subscriptions/` — `entitlements`, `guard`, `gallery-gate` קובעים מי רשאי לגשת למה, על בסיס תקופת ניסיון (trial) ומצב מנוי.
- `lib/trial/` — תזכורות סיום תקופת ניסיון ("עוד 3 ימים") והתראות פקיעה, נשלחות ב-cron.

**מסמך הארכיטקטורה המלא נמצא ב-[`docs/payments-architecture.md`](docs/payments-architecture.md)** — כולל דיאגרמות רצף ל-checkout ול-webhook, טבלת "מה עדיין לא ידוע" מול PayMe, ורשימת TODO מלאה לפני הפעלת קריאות אמת.

### פאנל ניהול פנימי (`/manage`)
מוגן באימייל בודד (`FEEDBACK_EMAIL`, ראו `lib/feedback-email.ts`), כולל שידור הודעות לצלמים, ניהול תוכניות מחיר (`PlanPricingManager`), ניקוי כיסויי גלריה/תמונות מקור יתומות, וחיפוש/בירור משתמשים לפי אימייל.

---

## מסד הנתונים (Supabase)

- 75+ מיגרציות SQL תחת `supabase/migrations/`, בסדר כרונולוגי (מ-`20250614...` ואילך) — הסכמה המלאה נבנית ע"י הרצתן ברצף.
- Row Level Security פעיל בכל טבלה; מדיניות RLS מוגדרת ב-`20250614000002_rls_policies.sql` ומתעדכנת במיגרציות מאוחרות יותר.
- טבלאות תשלומים עיקריות: `billing_customers`, `subscription_plans`, `subscriptions`, `payment_transactions`, `payment_webhook_events` — כתיבה רק דרך Service Role; שדות רגישים (`provider_metadata`, `raw_metadata`, payloads של webhook) לא נגישים ללקוח.
- שלושה סוגי קליינטים ב-`lib/supabase/`: `client.ts` (דפדפן, anon key), `server.ts` (שרת, per-request עם קוקיז), `admin.ts` (Service Role — שרת בלבד).

---

## משתני סביבה

צרו קובץ `.env.local` בשורש הפרויקט. המשתנים המסומנים ⚠️ **נדרשים בפרודקשן** (נבדק אוטומטית לפני build ע"י `scripts/check-required-env.mjs`).

### Supabase
| משתנה | תיאור |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | כתובת פרויקט Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | מפתח anon (לקוח) |
| `SUPABASE_SERVICE_ROLE_KEY` | מפתח service role — **שרת בלבד**, אף פעם לא בצד לקוח |
| `SUPABASE_ACCESS_TOKEN` | לשימוש בסקריפט `supabase:auth-urls` בלבד |

### אחסון מדיה — Cloudflare R2
| משתנה | תיאור |
|---|---|
| `R2_ACCESS_KEY_ID` | מפתח גישה |
| `R2_SECRET_ACCESS_KEY` | סוד גישה |
| `R2_ENDPOINT` | כתובת ה-endpoint של הבאקט |
| `R2_BUCKET_NAME` | שם הבאקט |
| `NEXT_PUBLIC_R2_PUBLIC_URL` / `R2_PUBLIC_URL` / `NEXT_PUBLIC_R2_BASE_URL` | כתובת ציבורית להגשת מדיה (הראשון שמוגדר מנצח) |

### כללי / אתר
| משתנה | תיאור |
|---|---|
| `NEXT_PUBLIC_APP_URL` ⚠️ | כתובת הבסיס של האפליקציה (משמש ב-emails, sitemap, robots, redirects) |
| `NEXT_PUBLIC_PRIVATE_GALLERY_URL` | דומיין מבודד להגשת גלריות פרטיות (`/g/*` בלבד) — ראו `middleware.ts` |
| `GALLERY_SESSION_SECRET` | סוד לחתימת סשן גישה לגלריה פרטית |
| `FEEDBACK_EMAIL` ⚠️ | האימייל היחיד המורשה להתחבר ל-`/manage`; **חובה בפרודקשן** |
| `ADMIN_NAME` | שם המוצג בהתראות פנימיות |
| `CRON_SECRET` | מאמת קריאות ל-`/api/cron/*` (Vercel Cron) |
| `MVP_BYPASS_USER_ID` | מזהה משתמש (או כמה, מופרדים בפסיק) שרואים את הדשבורד המלא + גלריות פרטיות עוד לפני שנפתח לכולם |
| `PHOTO_LIMIT_TEST_USER_ID` | מזהה משתמש לבדיקת מגבלות תמונות |

### דוא"ל (Resend)
| משתנה | תיאור |
|---|---|
| `RESEND_API_KEY` | מפתח API של Resend |
| `EMAIL_FROM` | כתובת השולח |

### Vercel API (דומיינים אישיים לצלמות)
| משתנה | תיאור |
|---|---|
| `VERCEL_API_TOKEN` | טוקן API של Vercel |
| `VERCEL_PROJECT_ID` | מזהה הפרויקט (`prj_...`) |
| `VERCEL_TEAM_ID` | נדרש רק אם הפרויקט תחת Team |

### תשלומים — כללי
| משתנה | תיאור |
|---|---|
| `PAYMENT_PROVIDER` | `payme` או `sumit` — קובע איזה מתאם נטען |
| `PAYMENTS_CHECKOUT_ENABLED` | `"true"` בלבד מפעיל checkout אמיתי; אחרת 503 + "זמין בקרוב" |
| `PAYMENTS_SMOKE_TEST_USER_ID` | allowlist לבדיקת smoke בפרודקשן (משתמש בודד, תוכנית `studio_monthly` בלבד) |
| `TRIAL_ENDING_REMINDERS_ENABLED` | מפעיל שליחת תזכורות סיום ניסיון בקרון |
| `TRIAL_EXPIRED_EMAIL_ENABLED` | מפעיל שליחת הודעת פקיעת ניסיון |
| `ENFORCE_SUBSCRIPTION_ACCESS` | מתועד בלבד כרגע — לא מחובר ל-middleware/guards בפועל |

### PayMe
| משתנה | תיאור |
|---|---|
| `PAYME_ENV` | `sandbox` / `production` |
| `PAYME_API_BASE_URL` | כתובת בסיס ל-API (נדרש התאמה מדויקת ל-host החי ב-production) |
| `PAYME_CLIENT_KEY` | מפתח לקוח |
| `PAYME_SELLER_ID` | מזהה מוכר |
| `PAYME_WEBHOOK_SECRET` | סוד לאימות webhook |

### SUMIT
| משתנה | תיאור |
|---|---|
| `SUMIT_API_BASE_URL` | כתובת בסיס (ברירת מחדל מוגדרת בקוד, ניתנת לדריסה) |
| `SUMIT_COMPANY_ID` | מזהה חברה |
| `SUMIT_API_KEY` | מפתח API |
| `SUMIT_PUBLIC_KEY` | מפתח ציבורי (אופציונלי) |
| `SUMIT_TEST_MODE` | `"true"` למצב בדיקה |
| `SUMIT_PAYMENTSJS_ENABLED` | `"true"` מפעיל את טופס הכרטיס בתוך האתר (מנוי מתחדש אמיתי). דורש את שני המפתחות הציבוריים למטה + בדיקת ₪29 חיה. כבוי → כפתור המסלול נופל לתשלום חד-פעמי |
| `NEXT_PUBLIC_SUMIT_COMPANY_ID` | זהה ל-`SUMIT_COMPANY_ID`. ציבורי — SUMIT מדפיסים אותו בכל דף תשלום |
| `NEXT_PUBLIC_SUMIT_API_PUBLIC_KEY` | מפתח הטוקניזציה הציבורי של PaymentsJS (= `SUMIT_PUBLIC_KEY`). ציבורי בכוונה |

### בדיקות RLS מקומיות בלבד (`test:payments-rls:local`)
| משתנה | תיאור |
|---|---|
| `SUPABASE_LOCAL_URL` / `SUPABASE_LOCAL_ANON_KEY` / `SUPABASE_LOCAL_SERVICE_ROLE_KEY` | מודפסים ע"י `supabase status -o env`; הסקריפט מסרב לכתובות שאינן local |

> **לעולם אל תשמרו או תדפיסו** מפתחות service role / סודות ספקי תשלום בלוגים, בקוד לקוח, או ב-commit.

---

## התקנה והרצה מקומית

דרישות: Node.js (תואם ל-Next.js 15 / React 19), חשבון Supabase, (אופציונלי לפיתוח מלא) Docker להרצת Supabase מקומי, חשבון Cloudflare R2.

```bash
# התקנת תלויות
npm install

# יצירת קובץ סביבה מקומי והשלמת המשתנים הרלוונטיים (ראו טבלה למעלה)
cp .env.example .env.local   # אם אין .env.example — צרו .env.local ידנית

# הרצת שרת פיתוח
npm run dev
# או עם Turbopack:
npm run dev:turbo
```

האפליקציה עולה בכתובת `http://localhost:3000`.

### הרצת Supabase מקומי (אופציונלי, נדרש לבדיקות RLS)

```powershell
npx supabase start
npx supabase db push --dry-run --local   # בדיקה בלבד, לא מיישם
npx supabase migration up --local
npx supabase status -o env               # מדפיס את שלושת המפתחות המקומיים
```

### בנייה לפרודקשן

```bash
npm run build   # מריץ אוטומטית scripts/check-required-env.mjs (prebuild)
npm run start
```

---

## סקריפטים זמינים

מתוך `package.json`:

| פקודה | תיאור |
|---|---|
| `npm run dev` | שרת פיתוח |
| `npm run dev:turbo` | שרת פיתוח עם Turbopack |
| `npm run build` | בנייה לפרודקשן (כולל בדיקת env מקדימה) |
| `npm run start` | הרצת build קיים |
| `npm run lint` | ESLint (`next lint`) |
| `npm test` | מריץ את חבילת הבדיקות המלאה (ראו למטה) |
| `npm run test:payments-rls:local` | בדיקות RLS מול Supabase מקומי בלבד |
| `npm run test:exploit-critical` | הרצת תרחישי exploit קריטיים (`scripts/exploit-critical-runtime.mjs`) |
| `npm run test:regression-critical` | הרצת בדיקות רגרסיה קריטיות |
| `npm run supabase:auth-urls` | עדכון auth redirect URLs בפרויקט Supabase (`SUPABASE_ACCESS_TOKEN`) |

סקריפטי CLI נוספים תחת `scripts/` (לא כולם ב-`package.json`, מורצים ישירות עם `tsx`/`node`):

- `list-studios-with-galleries.mjs` — רשימת סטודיואים עם גלריות.
- `run-payments-trace.ts` — מעקב אחר תהליך תשלום עבור משתמש smoke-test.
- קבוצת `test-sumit-*.ts` — בדיקות ידניות מול חשבון SUMIT (חיבור, checkout אמיתי, מנוי חוזר וכו').
- קבוצת `test-check-*.ts` / `test-find-*.ts` / `test-inspect-*.ts` / `test-list-*.ts` — כלי אבחון נקודתיים למסד הנתונים (בדיקת מנויים, favicon מיתוג, אובייקטי R2 בגלריה, אילוצי טבלה ועוד).

> קבצי `scripts/test-*.ts` הרבים שאינם רשומים ב-`package.json` (כפי שמופיע ב-`git status`) הם כלי אבחון/פיתוח חד-פעמיים — מריצים אותם ידנית לפי צורך, לא חלק מ-`npm test`.

---

## בדיקות (Testing)

`npm test` מריץ ברצף:

1. `scripts/test-ilike-escape.mjs` — בריחה נכונה של תווים ב-`ILIKE`.
2. `scripts/test-rate-limit-concurrency.mjs` — התנהגות rate-limit תחת concurrency.
3. `scripts/test-security-critical.mjs` — בדיקות אבטחה קריטיות.
4. `scripts/test-hero-video-security.mjs` — אבטחת העלאת וידאו הירו (Node עם `--experimental-strip-types`).
5. `scripts/test-payments.ts` — חבילת בדיקות תשלומים מקיפה (PayMe, SUMIT, flags, guards).
6. `scripts/test-trial-ending-reminders.ts` — לוגיקת תזכורות/אכיפת מנוי.

בדיקות RLS מול Supabase (`test:payments-rls:local`) דורשות Supabase מקומי פעיל ומסרבות לפעול מול כתובת שאינה local.

---

## אבטחה

- **CSP חלקי** (`next.config.ts`): `object-src 'none'; base-uri 'self'; frame-ancestors 'self'` + `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`. `script-src`/`style-src` **לא** מוגבלים בכוונה — עמוד הבית הציבורי מסתמך על `<script>`/`<style>` inline רבים וסקריפט חיצוני (`cdn.tailwindcss.com`) + Google Fonts; מדיניות מחמירה יותר דורשת מעבר ל-CSP מבוסס nonce (שינוי נפרד, לא בוצע עדיין).
- **בידוד גלריות פרטיות** ברמת middleware, ללא תלות ב-SDK-ים כבדים (Edge runtime).
- **תשלומים fail-closed**: אין הפעלת מנוי בלי webhook מאומת; פרטי כרטיס/CVV/תעודת זהות **לעולם לא** מתקבלים או נשמרים.
- **RLS מקיף**: כל טבלה מוגנת; שדות רגישים לא נגישים ללקוח.
- `scripts/exploit-critical-runtime.mjs` ו-`scripts/regression-critical-runtime.mjs` משמשים כבדיקות אבטחה/רגרסיה מורחבות מול סביבה אמיתית — יש להריץ בזהירות ורק מול סביבות מיועדות לכך.

לביצוע סקירת אבטחה מלאה על השינויים הנוכחיים, ניתן להשתמש בסקיל `/security-review`.

---

## Cron Jobs ומשימות רקע

מוגדרים ב-`vercel.json`, מאומתים ע"י `CRON_SECRET` (`lib/cron/authorize.ts`):

| נתיב | תזמון | תיאור |
|---|---|---|
| `/api/cron/cleanup-orphaned-photos` | יומי (`0 0 * * *`) | ניקוי תמונות יתומות מ-R2/DB |
| `/api/cron/trial-ending-reminders` | יומי (`0 0 * * *`) | שליחת תזכורות סיום תקופת ניסיון / חידוש מנוי |

---

## Deploy

הפרויקט בנוי לרוץ על **Vercel**:

- `vercel.json` מגדיר את ה-Cron Jobs.
- `scripts/check-required-env.mjs` רץ אוטומטית לפני `next build` ומכשיל את ה-build אם משתנה סביבה חובה (כרגע: `FEEDBACK_EMAIL`) חסר בסביבת `production` (מזוהה לפי `VERCEL_ENV`/`NODE_ENV`).
- תמונות: `images.unoptimized: true` — התמונות כבר נדחסות בצד לקוח לפני העלאה ל-R2, כך שהדפדפן טוען אותן ישירות ללא Vercel Image Optimization. דומיינים מורשים: `*.supabase.co`, `albums.studio-galleries.com`, `*.r2.cloudflarestorage.com`.
- Server Actions ו-middleware מוגדרים לגוף בקשה עד 50MB (`experimental.serverActions.bodySizeLimit`, `middlewareClientMaxBodySize`) — נדרש להעלאות מדיה.

---

## מוסכמות פיתוח

- **RTL/עברית**: כל הטקסט למשתמש בעברית; רכיבים תומכים RTL באופן טבעי.
- **Server Actions תחת `lib/actions/`**, לא לוגיקה עסקית ישירות ברכיבי UI.
- **גישה לספקי תשלום רק דרך `PaymentService`** — לעולם לא ישירות מ-UI או מ-Route Handler.
- **מפתחות Service Role / סודות ספק** נקראים אך ורק במודולי שרת (`server-only` package אוכף זאת בחלק מהקבצים).
- **Feature flags** נבדקים כמחרוזת מדויקת `"true"` — כל ערך אחר (כולל `undefined`) נחשב כבוי.
- הוספת ספק תשלום חדש: ראו סעיף "Adding a provider" ב-[`docs/payments-architecture.md`](docs/payments-architecture.md).
