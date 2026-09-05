# תוכנית: מחזור חיים של גלריות לקוח — "שימוש אחד" + מחיקה אוטומטית

מסמך זה מסכם החלטת מוצר של Lea (שיחה מ‑05/09/2026) על איך גלריות לקוח (private / client galleries) אמורות להתנהג לאורך זמן: מרגע היצירה, דרך השליחה ללקוח, ועד מחיקה. נכתב כדי שאפשר יהיה לבצע אותו בשלבים בשיחה נפרדת.

**קרא את המסמך במלואו לפני שכותבים קוד.**

> הרקע: היום אין שום דבר שחוסם מיחזור של גלריה — כל המכסות נספרות על "כמה יש עכשיו", אף אחת לא על "כמה נוצר אי‑פעם". צלמת יכולה לקנות פאס אחד / חבילה, למחוק תמונות מגלריה שנשלחה, ולהעלות מחדש ללקוח אחר — קרדיט אחד = אינסוף לקוחות. אותו דבר בחינם (גלריה 1) ובמנוי (X במקביל). המודל למטה סוגר את זה בלי מנגנון השהיה/מכסות גמישות מסובך.

---

## 1. המודל המאושר

### א. שימוש אחד לכל גלריית לקוח
- **הגלריה ננעלת בשליחה הראשונה ללקוח.** מאותו רגע אי אפשר להוסיף / למחוק / להחליף תמונות באלבום המקור — **גם לא לצלמת**.
- מכסת התמונות ננעלת ברגע השליחה. **לא גדלה בדיעבד, אף פעם**, גם אם הצלמת שדרגה מסלול.
- זרימת התמונות המעובדות (אחרי בחירת הלקוח — `edited_photos` / `registerEditedPhotosBatch`) **ממשיכה לעבוד** — זה חלק מאותו job.
- גם `expires_at` ננעל בשליחה — אין הארכה. (ראו ב'.)

### ב. אורך חיים של גלריית לקוח = 60 יום מהשליחה
- לכל גלריית לקוח יש `expires_at`. אם הצלמת לא הגדירה תאריך, המערכת מציבה **`expires_at = שליחה + 60 יום`**. *(פאס: `validity_days` מהחבילה — זה כל אורך החיים, לא רק "חלון".)*
- **`expires_at` הוא גם סוף גישת הלקוח וגם מועד המחיקה.** אין שלב "נעול אבל קיים" ממושך — הלקוח נחסם ב‑`expires_at`, והקרון היומי מוחק את הגלריה בהרצה הראשונה אחרי זה.
- **מחיקה = הכל:** שורת הגלריה, כל התמונות, `edited_photos`, וכל האחסון ב‑R2 (`originals`, `previews`, `watermarked`, `edited`, `zips`).
- **אין כפתור הארכה.** ב‑UI כתוב: *"במקרים חריגים ניתן לפנות אלינו."*
- מיילים לצלמת: **14 יום / 3 ימים / יום אחד לפני `expires_at`** (כלומר ~ימים 46 / 57 / 59 מהשליחה בברירת מחדל). אם החלון קצר מ‑14 יום — שולחים רק את האזהרות שעוד בעתיד.
- `expires_at` ננעל בשליחה — אין הארכה אחרי זה (§א).

### ג. פינוי מקום
- אין הגדלה של גלריה קיימת. הצלמת **מוחקת גלריה** (ידנית או שהיא נמחקת אוטומטית) → מתפנה slot במכסת המקביל → אפשר ליצור חדשה, והחדשה מקבלת את מכסת המסלול **הנוכחי** (גדולה יותר אם שדרגה).

### ד. מסלול חינם
- **גלריה אחת במקביל, מכסה של 400 תמונות.** מתנהגת בדיוק כמו כל גלריה אחרת (שימוש אחד + מחיקה אוטומטית).
- הדגל `users.free_private_gallery_created` ("לכל החיים") **מבוטל** — מוחלף בספירה חיה של גלריות `selection` קיימות. כשגלריה נמחקת (ידנית או אוטומטית) → ה‑slot נפתח שוב.

### ה. מנוי גלריות פרטיות שנגמר
- **15 יום חסד** אחרי שהזכאות פגה. בזמן הזה הגלריות עובדות רגיל.
- אחרי 15 יום בלי חידוש → **כל גלריות הלקוח של הסטודיו מושהות**: גם הלקוח **וגם הצלמת** חסומים מהתוכן, עד חידוש המנוי.
- חידוש המנוי מבטל את ההשהיה **מיידית** (hook סינכרוני ב‑return handler של התשלום, כמו custom domains).
- **שעון המחיקה (`expires_at`) רץ בנפרד מההשהיה** — גלריה מושהית עדיין נמחקת בתאריך שלה.

### ו. פאס בודד
- `expires_at` = שליחה + `validity_days` מהחבילה. זה כל אורך החיים.
- אחריו הלקוח חסום והגלריה נמחקת (כמו כל גלריית לקוח).
- **אין חידוש בתשלום.** אפשר למחוק ידנית מוקדם יותר.

### ז. אישור שליחה
- כפתור "שליחת גלריה ללקוח" יציג אזהרה ברורה **לפני** השליחה: *"אחרי השליחה לא ניתן להוסיף או למחוק תמונות בגלריה זו. ניתן יהיה להעלות רק תמונות מעובדות."* — עם אישור מפורש.

---

## 2. המצב היום (מה קיים, מה הפער)

| תחום | היום | הפער |
|---|---|---|
| נעילת אלבום אחרי שליחה | לא קיים. `reservePhotosBatch` / `deletePhotosBulk` / `deletePhoto` פועלים תמיד | להוסיף guard לגלריות `selection` שנשלחו |
| `expires_at` בשליחה | נקבע **רק** לגלריות פאס ([gallery.actions.ts:315‑333](../lib/actions/gallery.actions.ts#L315-L333)). גלריות מנוי/חינם — נשאר `null` אם הצלמת לא הגדירה | להוסיף ברירת מחדל 60 יום בשליחה לכל גלריית `selection` |
| חלון פג | הלקוח נחסם ([client-gallery.actions.ts:196](../lib/actions/client-gallery.actions.ts#L196), [:274](../lib/actions/client-gallery.actions.ts#L274)). קרון הפאס מסמן `status='locked'` ([lifecycle.ts](../lib/gallery-pass/lifecycle.ts)) — רק לגלריות פאס | להרחיב את הקרון לכל גלריות `selection` + להוסיף מחיקה |
| מחיקה אוטומטית | לא קיימת. `cleanupOrphanedPhotos` מוחק רק תמונות שמעולם לא הועלו | להוסיף שלב מחיקה לקרון היומי + helper מחיקה לגלריה בודדת |
| מכסת תמונות פרטית | נספרת על `count(*)` נוכחי ([gallery-photo-limits.ts:82‑92](../lib/gallery-photo-limits.ts#L82-L102)) | נשארת ככה — אבל אחרי נעילה אי אפשר להעלות בכלל, אז המיחזור חסום |
| חינם = 1 לכל החיים | `users.free_private_gallery_created` נכתב ב‑[gallery.actions.ts:531‑534](../lib/actions/gallery.actions.ts#L531-L534), נקרא ב‑[loader.ts:62](../lib/private-galleries/loader.ts#L62); `is_lifetime_cap=true` בשורת ה‑free ב‑`private_gallery_tiers` | להפוך ל‑`is_lifetime_cap=false`, `max_galleries=1`, `max_photos_per_gallery=400`; לנקות את הכתיבה/קריאה של הדגל |
| השהיית מנוי שפג | לא קיים. מנוי שפג פשוט מחזיר tier='free' דרך [loader.ts](../lib/private-galleries/loader.ts) — הגלריות ממשיכות לעבוד | להוסיף `suspended_at` + קרון sweep + hook החזרה, על בסיס התבנית של [custom-domain-suspension.ts](../lib/domains/custom-domain-suspension.ts) |
| אישור שליחה | `SendGalleryToClientButton` שולח מיד בלי אזהרה | להוסיף דיאלוג אישור |

**חוקים חשובים בקוד הקיים שצריך לשמר:**
- `assertGalleryOwner(galleryId)` ([lib/auth/gallery-owner.ts](../lib/auth/gallery-owner.ts)) הוא ה‑chokepoint לכל מוטציות התמונות — כדאי להוסיף שם את `photos_locked_at` / `gallery_type` ל‑`select` ולהחזיר אותם, ואז guard נקודתי ב‑actions.
- תמונות מעובדות עוברות דרך `edited_photos` + `registerEditedPhoto(s)Batch` — **לא** דרך `reservePhotosBatch`. אז נעילת `reservePhotosBatch` לא נוגעת בהן. לוודא בזמן המימוש ש‑`reservePhotosBatch` באמת לא נקרא בזרימת המעובדות (כרגע `isProcessed` כמעט תמיד `false`, ו‑`UploadEdited.tsx` משתמש ב‑`registerEditedPhotosBatch`).
- קרון קיים: `/api/cron/trial-ending-reminders` ([route](../app/api/cron/trial-ending-reminders/route.ts)) רץ יומי (`0 0 * * *` ב‑[vercel.json](../vercel.json)) וכבר קורא ל‑`runGalleryPassLifecycle`. שם מוסיפים.
- מעטפת מייל: `renderLuxeEmail` ב‑[lib/email/resend.ts:231](../lib/email/resend.ts#L231). `sendGalleryPassExpiringEmail` ([:475](../lib/email/resend.ts#L475)) היא תבנית טובה למיילי המחיקה.
- reactivation בתשלום: התבנית היא `reactivateSuspendedCustomDomains` שנקראת ב‑return handler של SUMIT ([lib/payments/payment-service.ts](../lib/payments/payment-service.ts)).

---

## 3. שינויי סכמה (מיגרציות)

### 3.1 `galleries` — שלוש עמודות חדשות
```sql
alter table public.galleries
  add column photos_locked_at    timestamptz,           -- נקבע בשליחה הראשונה. לא null = אלבום נעול
  add column suspended_at        timestamptz,           -- לא null = מושהה עקב מנוי שפג
  add column deletion_warning_stage smallint not null default 0; -- 0=כלום, 1=נשלח 14 יום, 2=נשלח 3 ימים, 3=נשלח יום
```
- אינדקס חלקי לקרון המחיקה:
  ```sql
  create index galleries_client_lifecycle_idx
    on public.galleries (expires_at)
    where gallery_type = 'selection' and photos_locked_at is not null;
  ```
- **גרנדפאדרינג:** גלריות שכבר נשלחו לפני הפריסה יקבלו `photos_locked_at = null` → **לא ננעלות ולא נמחקות אוטומטית**. רק גלריות שנשלחות אחרי הפריסה נכנסות למשטר החדש. (החלטת Lea — לא לתקוע צלמות באמצע עבודה.) הטיפול ב‑backlog הישן — ראו §6 "פתוח".

### 3.2 `private_gallery_tiers` — עדכון שורת ה‑free (שינוי דאטה, לא DDL)
`max_galleries=1` ו‑`max_photos_per_gallery=400` **כבר מוגדרים** בשורת ה‑free. השינוי היחיד:
```sql
update public.private_gallery_tiers
  set is_lifetime_cap = false
  where tier = 'free';
```
זה לבדו מעביר את [gallery.actions.ts](../lib/actions/gallery.actions.ts) ממסלול "lifetime" למסלול "ספירה במקביל" (§4.4). עדיף מיגרציה מ‑/manage כדי שיהיה אטומי עם שאר השינוי. (ערכי starter/pro/unlimited: 8·400 / 16·850 / 35·1500 — נשארים.)

### 3.3 `database.types.ts`
לרענן אחרי המיגרציה (`supabase gen types` או ידני): שלוש העמודות החדשות ב‑`galleries` Row/Insert/Update.

---

## 4. שינויי קוד — לפי אזור

### 4.1 נעילת "שימוש אחד"

**Helper חדש** — `lib/private-galleries/gallery-lock.ts`:
```ts
/** זורק אם אי אפשר יותר לערוך את אלבום המקור של גלריית לקוח (נשלחה => נעולה). */
export async function assertClientAlbumEditable(supabase, galleryId: string): Promise<void>
// שולף gallery_type + photos_locked_at; אם selection && photos_locked_at != null →
// throw new Error('הגלריה נשלחה ללקוח — לא ניתן להוסיף או למחוק תמונות באלבום. ניתן עדיין להעלות תמונות מעובדות.')
```

**קריאות ל‑guard** ב‑[lib/actions/photo.actions.ts](../lib/actions/photo.actions.ts):
- `reservePhotosBatch` — ✅ לחסום (העלאת אלבום)
- `deletePhotosBulk` — ✅ לחסום
- `deletePhoto` — ✅ לחסום
- `cleanupPhotosBatch` — ✅ לחסום (עקביות; ממילא לא יהיו שורות לנקות אם reserve נחסם)
- `registerEditedPhoto` / `registerEditedPhotosBatch` — ❌ **לא** לחסום (מעובדות = אותו job)
- `setPhotosVisibilityBulk` / `togglePhotoVisibility` / `setPhotosProcessedBulk` — ❌ לא לחסום (הסתרה/סדר של קיימות, לא הוספה/מחיקה)

**ב‑[lib/actions/gallery.actions.ts](../lib/actions/gallery.actions.ts):**
- `sendGallery` — בשליחה הראשונה (`photos_locked_at is null`):
  1. קובע `photos_locked_at = now()`
  2. אם `expires_at is null` → קובע `expires_at = now() + interval '60 days'` (הרחבה של הבלוק הקיים ב‑[:318‑333](../lib/actions/gallery.actions.ts#L318-L333) שהיום עושה את זה רק לפאס)
- `updateGallerySettings` — לחסום `expiresAt` ו‑`password` כשהגלריה נעולה (`assertClientAlbumEditable` מכסה גם את זה, או guard משלה עם הודעה מתאימה). כותרת (`title`) — מותר גם אחרי נעילה.

**UI:**
- [ClientGalleryDetail.tsx](../components/dashboard/ClientGalleryDetail.tsx) / [GalleryPhotosSection.tsx](../components/gallery/GalleryPhotosSection.tsx) — כשנעול: להסתיר את אזור העלאת האלבום ואת כפתורי המחיקה, להציג באנר *"הגלריה נשלחה — אלבום המקור נעול. ניתן להעלות תמונות מעובדות בלבד."*
- [ClientGalleryEditForm.tsx](../components/dashboard/ClientGalleryEditForm.tsx) — כשנעול: להשבית את שדה תאריך התפוגה (מציג את הערך, לא ניתן לעריכה) + טקסט "במקרים חריגים ניתן לפנות אלינו".

### 4.2 אישור שליחה (§1.ז)
- [SendGalleryToClientButton.tsx](../components/dashboard/SendGalleryToClientButton.tsx) — לעטוף את השליחה הראשונה ב‑`Dialog` אישור עם הטקסט מ‑§1.ז. שליחה חוזרת (`resendGalleryEmail`) — בלי אישור (הגלריה כבר נעולה ממילא).

### 4.3 מחיקה אוטומטית + מיילים

**Helper חדש** — `lib/private-galleries/delete-client-gallery.ts`:
```ts
/** מוחק גלריית לקוח אחת לגמרי: R2 (5 buckets) + edited_photos + photos + download_jobs + gallery row. */
export async function deleteClientGalleryCompletely(galleryId: string): Promise<void>
```
- לאמץ את `collectGalleryMediaPaths` מ‑[lib/admin/delete-studio.ts:66‑149](../lib/admin/delete-studio.ts#L66-L149) ל‑scope של גלריה בודדת; + `deleteMediaPrefix(bucket, \`${userId}/${galleryId}/\`)` כחגורה+שלייקס.
- FK cascade: לוודא ש‑`photos`, `edited_photos`, `gallery_settings`, `photo_selections`, `download_jobs` נמחקים ב‑cascade כשמוחקים את שורת הגלריה (אם לא — למחוק במפורש לפי הסדר).

**מייל חדש** — `sendClientGalleryDeletionWarningEmail` ב‑[lib/email/resend.ts](../lib/email/resend.ts) (מבוסס על `sendGalleryPassExpiringEmail`): מקבל `{ galleryId, galleryTitle, userId, deletionAt, daysLeft }`.

**הרחבת הקרון** — `lib/gallery-pass/lifecycle.ts` → לשנות שם ל‑`lib/private-galleries/client-gallery-lifecycle.ts` (ולהשאיר re-export), הפונקציה `runClientGalleryLifecycle`. שלבים (כל אחד idempotent, scope = `gallery_type='selection' AND photos_locked_at IS NOT NULL`):
1. **מיילי אזהרה** — לפי `deletion_warning_stage`, יחסית ל‑`expires_at` (= מועד המחיקה):
   - stage 0 → 1 כש‑`now() >= expires_at - 14d`
   - stage 1 → 2 כש‑`now() >= expires_at - 3d`
   - stage 2 → 3 כש‑`now() >= expires_at - 1d`
   - claim‑then‑send (עדכון stage לפני שליחה) כמו התזכורות הקיימות. אם החלון קצר מ‑14 יום, האזהרות שכבר בעבר פשוט מדולגות.
2. **מחיקה** — `expires_at <= now()` → `deleteClientGalleryCompletely(id)` לכל אחת. לוג מפורט (id, title, userId, כמה תמונות). (אין שלב `status='locked'` נפרד — הלקוח כבר חסום מבדיקת `expires_at`, והגלריה נמחקת בהרצה הבאה.)
3. (קיים) מחיקת קרדיטי פאס `pending` נטושים.

`/api/cron/trial-ending-reminders/route.ts` — להחליף את הקריאה ל‑`runGalleryPassLifecycle` ב‑`runClientGalleryLifecycle`, ולהוסיף את הספירות ל‑`body`.

### 4.4 מסלול חינם: דגל → ספירה

- [lib/private-galleries/loader.ts](../lib/private-galleries/loader.ts) — `getPrivateGalleryEntitlements`: כש‑`limits.isLifetimeCap === false` (מה שיקרה אחרי המיגרציה), `lifetimeUsed` כבר לא רלוונטי. אפשר להשאיר את הקריאה של `free_private_gallery_created` או להסיר.
- [lib/actions/gallery.actions.ts](../lib/actions/gallery.actions.ts) — הבלוק ב‑[:453‑478](../lib/actions/gallery.actions.ts#L453-L478): `isLifetimeCap` יהיה `false` → נופל אוטומטית למסלול הספירה (`buildPrivateGalleryCountLimitError(count, 1, false)` → *"ניתן ליצור עד 1 גלריות פרטיות במקביל במסלול הנוכחי. מחקי גלריה קיימת או שדרגי."* — בדיוק הרצוי). להסיר את `unlocksFreePrivateGallerySlot` ואת הכתיבה ל‑`free_private_gallery_created` ([:446‑457](../lib/actions/gallery.actions.ts#L446-L457), [:531‑534](../lib/actions/gallery.actions.ts#L531-L534)).
- [components/dashboard/PrivateGalleryQuotaSummary.tsx](../components/dashboard/PrivateGalleryQuotaSummary.tsx) / [PrivateGalleriesSubscriptionPanel.tsx](../components/dashboard/PrivateGalleriesSubscriptionPanel.tsx) — לוודא שהטקסט מציג "1 מתוך 1" ולא "נוצלה גלריה לכל החיים".
- `scripts/test-private-gallery-entitlements.ts` — לעדכן את המקרים של free.
- **הערה למוצר:** אחרי השינוי, "חינם" = גלריה אחת בכל רגע, 400 תמונות, 60 יום חיים ואז נמחקת וה‑slot מתאפס. זה tier די שמיש — כדאי לוודא שהמסלולים בתשלום נבדלים מספיק (מספר גלריות במקביל בעיקר).

### 4.5 השהיית מנוי שפג

**סכמה:** `galleries.suspended_at` (§3.1).

**Helper חדש** — `lib/private-galleries/gallery-suspension.ts` (תבנית: [custom-domain-suspension.ts](../lib/domains/custom-domain-suspension.ts)):
```ts
export async function reactivateSuspendedClientGalleries(userId: string): Promise<void>
// suspended_at = null לכל גלריות selection של המשתמש. נקרא סינכרונית עם הפעלת מנוי.

export async function suspendClientGalleriesWithLapsedSubscription(): Promise<{checked; suspended}>
// sweep יומי. לכל משתמש עם גלריות selection לא‑מושהות:
//  - getPrivateGalleryEntitlements(userId)
//  - אם source==='free' אבל קיימת שורת subscription של product='private_galleries'
//    שפגה לפני יותר מ‑15 יום (current_period_end / updated_at + 15d < now) → suspended_at=now() לכולן
//  - משתמש שמעולם לא היה לו מנוי private_galleries → לא נוגעים (רק מגבלת יצירה חלה)
```

**Hook החזרה:** ב‑[lib/payments/payment-service.ts](../lib/payments/payment-service.ts) — במקום שבו מנוי `private_galleries` מופעל/מתחדש (handleCheckout / subscribeWithToken / renewal), לקרוא `reactivateSuspendedClientGalleries(userId)`. *(למצוא את הנקודה המדויקת בזמן המימוש — מקבילה ל‑`reactivateSuspendedCustomDomains`.)*

**קרון:** להוסיף `suspendClientGalleriesWithLapsedSubscription()` ל‑`/api/cron/trial-ending-reminders/route.ts` (בלוק try/catch עצמאי כמו השאר).

**חסימת לקוח** — [lib/actions/client-gallery.actions.ts](../lib/actions/client-gallery.actions.ts): בכל הנקודות שבודקות `status === 'locked'` / `expires_at`, להוסיף בדיקת `suspended_at != null` → `{ ok: false, error: 'הגלריה אינה זמינה כרגע. פנו לצלם/ת.' }` (בלי לחשוף פרטי חיוב ללקוח).

**חסימת צלמת** — [components/dashboard/ClientGalleryDetail.tsx](../components/dashboard/ClientGalleryDetail.tsx): אם `suspended_at != null` → מסך נעול במקום התוכן, עם CTA "חדשי מנוי כדי לשחזר גישה" + אפשרות למחוק את הגלריה. (Lea: "גם הצלמת חסומה".)

**מייל** — `sendClientGalleriesSuspendedEmail(userId)` — פעם אחת כשמושהות, עם קישור לחידוש.

**באנר דשבורד** — [PrivateGalleriesSubscriptionPanel.tsx](../components/dashboard/PrivateGalleriesSubscriptionPanel.tsx) / דף `/dashboard/private-galleries` — באנר גלובלי כשיש גלריות מושהות.

---

## 5. סדר יישום מוצע (כל שלב נפרד, נבדק, ניתן לפריסה)

| שלב | תוכן | סיכון | ערך |
|---|---|---|---|
| **1** | נעילת "שימוש אחד" (§4.1) + אישור שליחה (§4.2). מיגרציה: `photos_locked_at` בלבד | נמוך — גרנדפאדרינג מלא | גבוה — סוגר את הפרצה המרכזית |
| **2** | חלון ברירת מחדל + מחיקה אוטומטית + מיילים (§3.1 שאר העמודות, §4.3) | בינוני — מחיקה בלתי הפיכה, צריך מיילים אמינים | גבוה — עלות אחסון |
| **3** | מסלול חינם: דגל→ספירה + מכסת 400 (§3.2, §4.4) | נמוך | בינוני |
| **4** | השהיית מנוי שפג (§4.5) | בינוני‑גבוה — חסימת לקוח + צלמת, hook תשלום | בינוני |

---

## 6. שאלות פתוחות / הוחלט לדחות

1. **אורך חיים — סגור:** 60 יום מהשליחה (Lea, 05/09). זהו גם סוף הגישה וגם מועד המחיקה. הצלמת יכולה לקצר לפני שליחה, לא להאריך.
2. **גלריות ישנות (לפני הפריסה)** — גרנדפאדרות לגמרי (לא ננעלות, לא נמחקות). זה משאיר את עלות האחסון הקיימת. אופציה עתידית: קמפיין מכוון — התראה מראש לכל הגלריות הישנות ואז backfill של `photos_locked_at`. **לא בתוכנית הזו.**
3. **פאס ישן שכבר נשלח** — גם גרנדפאדר (נעילת חלון כמו היום, בלי מחיקה). פאסים חדשים — מחזור מלא.
4. **"מקרים חריגים ניתן לפנות אלינו"** — צריך כתובת/טופס יעד. כרגע רק טקסט.
5. **מכסת גלריות במקביל למסלולי תשלום** — קיים: free 1·400, starter 8·400, pro 16·850, unlimited 35·1500. הקפיצה חינם→starter ברורה. נשאר.
6. **התחזות (impersonation)** — לוודא ש‑guard הנעילה וההשהיה לא חוסמים פעולות אדמין לגיטימיות דרך impersonation (או שכן — להחליט).

---

## 7. אינדקס קבצים

**מיגרציות (חדש):**
- `supabase/migrations/<ts>_add_client_gallery_lifecycle.sql` — 3 עמודות ב‑`galleries` + אינדקס + עדכון שורת free ב‑`private_gallery_tiers`

**קוד חדש:**
- `lib/private-galleries/gallery-lock.ts` — `assertClientAlbumEditable`
- `lib/private-galleries/delete-client-gallery.ts` — `deleteClientGalleryCompletely`
- `lib/private-galleries/gallery-suspension.ts` — `reactivate...` / `suspend...WithLapsedSubscription`
- `lib/private-galleries/client-gallery-lifecycle.ts` — `runClientGalleryLifecycle` (מ‑`lib/gallery-pass/lifecycle.ts`)

**קוד קיים לשינוי:**
- [lib/actions/photo.actions.ts](../lib/actions/photo.actions.ts) — guards ב‑reserve/delete/cleanup
- [lib/actions/gallery.actions.ts](../lib/actions/gallery.actions.ts) — `sendGallery` (lock + default expiry), `updateGallerySettings` (guard), הסרת `free_private_gallery_created`
- [lib/actions/client-gallery.actions.ts](../lib/actions/client-gallery.actions.ts) — בדיקות `suspended_at` בנתיב הלקוח
- [lib/auth/gallery-owner.ts](../lib/auth/gallery-owner.ts) — להוסיף `gallery_type`, `photos_locked_at`, `suspended_at` ל‑select/return
- [lib/private-galleries/loader.ts](../lib/private-galleries/loader.ts) — ניקוי `lifetimeUsed`
- [lib/email/resend.ts](../lib/email/resend.ts) — `sendClientGalleryDeletionWarningEmail`, `sendClientGalleriesSuspendedEmail`
- [lib/payments/payment-service.ts](../lib/payments/payment-service.ts) — hook `reactivateSuspendedClientGalleries`
- [app/api/cron/trial-ending-reminders/route.ts](../app/api/cron/trial-ending-reminders/route.ts) — קריאות לקרון החדש
- [components/dashboard/SendGalleryToClientButton.tsx](../components/dashboard/SendGalleryToClientButton.tsx) — דיאלוג אישור
- [components/dashboard/ClientGalleryDetail.tsx](../components/dashboard/ClientGalleryDetail.tsx) — מצב נעול + מצב מושהה
- [components/dashboard/ClientGalleryEditForm.tsx](../components/dashboard/ClientGalleryEditForm.tsx) — שדה תפוגה נעול אחרי שליחה
- [components/gallery/GalleryPhotosSection.tsx](../components/gallery/GalleryPhotosSection.tsx) — הסתרת העלאה/מחיקה כשנעול
- [components/dashboard/PrivateGalleriesSubscriptionPanel.tsx](../components/dashboard/PrivateGalleriesSubscriptionPanel.tsx) / [PrivateGalleryQuotaSummary.tsx](../components/dashboard/PrivateGalleryQuotaSummary.tsx) — טקסט חינם + באנר השהיה
- `scripts/test-private-gallery-entitlements.ts`, `scripts/test-gallery-kind.ts` — עדכון + מקרים חדשים

**בדיקות חדשות:**
- `scripts/test-client-gallery-lifecycle.ts` — נעילה בשליחה, guard על reserve/delete, מותר על מעובדות, תנאי המחיקה בקרון, גרנדפאדרינג, השהיה/החזרה
