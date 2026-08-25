# תדרוך: בנייה מחדש של האתר הציבורי (4 ערכות עיצוב) — לשיחה חדשה

מסמך זה נכתב כדי להעביר קונטקסט לשיחת Claude Code חדשה, אחרי ששיחה קודמת התמלאה. הוא מסכם: מה גילינו על המצב הקיים, מה כבר בוצע, ומה ההחלטה החדשה של המשתמשת (Lea) לגבי איך להמשיך.

**קרא את המסמך הזה במלואו לפני שמתחילים לכתוב קוד.**

---

## ההחלטה הנוכחית (הכי חשוב — קרא קודם)

Lea ביקשה **לעצור** את הגישה הקודמת (refactor הדרגתי של הקוד הקיים) ולעבור לגישה חדשה:

> "אל תמשיך לשנות עוד את הקוד הקיים. דבר ראשון תתחיל לבנות את 4 הערכות מופרדות, כל אחת בתיקייה. אני אגיד לך מה משותף... אבל שים לב המבנה משותף, הפונטים והצבעים הם לפי הערכה. אני רוצה סדר מופתי ובלי אלפי שורות קוד בדף, כמה שיותר פיצול לקומפוננטות."

כלומר:
1. **אל תערכי את קבצי ה-`lib/*-html.ts` / `lib/homepage-themes/*.ts` הקיימים** — הם ממשיכים לשרת את האתר החי כמו שהם, בלי נגיעה, עד שההחלפה תהיה מוכנה.
2. **תבני מחדש, בצד, 4 ערכות נושא נפרדות** — כל ערכה בתיקייה משלה, קומפוננטות React אמיתיות (לא מחרוזות HTML).
3. **מבנה (structure) משותף בין הערכות** לפחות עבור: סקשן גלריות, סקשן תמונות אחרונות, סקשן בלוג. יש סיכוי (לא ודאי) שגם סקשן תגובות/המלצות משותף — **לוודא איתה** לפני שמניחים.
4. **פונטים וצבעים הם per-theme** — כלומר קומפוננטת ה-structure המשותפת מקבלת אותם כ-props/theme-config, לא הארד-קוד.
5. **"סדר מופתי"** — קומפוננטות קטנות, לא קבצים של אלפי שורות. פיצול מקסימלי.
6. זו הרחבה משמעותית מעבר ל"Phase 2" שתוכנן קודם (שם רק ה-header/footer היו אמורים לעבור ל-React, ותוכן העמוד היה נשאר HTML גולמי בתוך iframe) — עכשיו הכוונה כנראה **לבנות מחדש ב-React אמיתי גם את תוכן העמודים עצמם**, לא רק header/footer. זה צריך להיסגר איתה במפורש בתחילת השיחה החדשה לפני שכותבים קוד — ראו "שאלות פתוחות" למטה.

---

## המצב הקיים באתר הציבורי (למה בכלל הגענו לזה)

### איך זה בנוי היום
- כל עמוד ציבורי (`app/[slug]/page.tsx`, `/portfolio`, `/blog`, `/blog/[postId]`, `/before-after`) קורא לפונקציית `generate...HTML()` שמחזירה **מחרוזת HTML שלמה ועצמאית** (`<!DOCTYPE html><html><head>...</head><body>...</body></html>`), הכוללת: Tailwind CDN (`<script src="https://cdn.tailwindcss.com">`), `tailwind.config` דינמי עם הצבע של הסטודיו, `<style>` עם עוד CSS, וכל התוכן.
- המחרוזת הזו מוזרקת ל-`<iframe srcDoc={html}>` דרך `components/photographer/HtmlFramePage.tsx` — גובה קבוע `100vh`, גלילה **פנימית** בתוך ה-iframe.
- `app/[slug]/layout.tsx` כמעט ריק — רק בדיקת שער גישה (`SiteGateScreen`), ואז `return children`. **אין layout אמיתי, אין רכיב קבוע.**
- כל עמוד/ערכה חוזר ובונה את ה-nav/footer/head/פונטים מחדש בעצמו — חלקים מהקוד משותפים בפועל (`generateSiteNav`, `generateSiteFooter`, `generateSiteNavStyles`, `buildPublicSiteChrome` — כולם ב-`lib/photographer-site-chrome.ts`), אבל **לא הכל**, וזה גרם למספר באגים אמיתיים (ראו "מה כבר תוקן" למטה).
- קבצים "מארחי-הכל" (4 ערכות ביחד, `if (theme === 'x')` בכל אחד): `lib/public-portfolio-html.ts`, `lib/public-blog-html.ts`, `lib/public-before-after-html.ts`, `lib/public-gallery-html.ts`, `lib/photographer-site-chrome.ts`. דף הבית כן מפוצל מראש לפי ערכה: `lib/homepage-themes/{classic,elegant,modern,dark}.ts`, מורכבים דרך `lib/homepage-themes/generate-homepage-html.ts`.

### תגליות טכניות חשובות (לזכור לפני שבונים מחדש)

1. **קישורי ניווט משתמשים ב-`target="_parent"`** — כי בלי זה, קליק בתוך ה-iframe היה מנווט את ה-iframe עצמו, לא את הדפדפן האמיתי. המשמעות: **כל ניווט היום הוא טעינה מלאה של כל הדפדפן**, לא אפילו client-side routing של Next.js. זו בדיוק הסיבה שבנייה מחדש ב-React אמיתי (`next/link`) תהיה שיפור ביצועים אמיתי, לא רק קוסמטי.

2. **קישורים מעמוד-משנה לסקשן בדף הבית משתמשים ב-query param, לא hash**: `homepageSectionHref(homepagePath, sectionId)` (ב-`lib/photographer-site-paths.ts`) בונה `${homepagePath}?section=${sectionId}`. דף הבית קורא את זה ב-load (`readHomepageInitialSection`, `generateHomepageSectionScrollScript`) וגולל לסקשן. **צריך לשמר את ההתנהגות הזו** (או לתכנן מנגנון מקביל) בבנייה מחדש.

3. **הצבע הדינמי של הסטודיו (accent color) מיושם דרך Tailwind CDN runtime config** — `tailwind.config = { theme: { extend: { colors: { primary: "${primaryColor}" } } } }` נבנה מחדש בכל טעינת עמוד עם הצבע האמיתי. זו כנראה הסיבה המקורית לכל הארכיטקטורה הזו — Tailwind הרגיל (build-time, של האפליקציה עצמה) לא יכול "לדעת" צבע דינמי לכל צלמת בזמן build. **בבנייה מחדש ב-React אמיתי, צריך להשתמש ב-CSS custom properties** (`style={{'--accent': primaryColor}}` + קלאסים כמו `text-[var(--accent)]`) — זה כבר דפוס מוכח בקוד הזה (הדשבורד עושה בדיוק את זה עם `--dashboard-accent`, וגם הקומפוננטות שנבנו היום ל-classic theme — ראו למטה).

4. **צביעת לוגו (`shouldColorLogo`)** — רק ל-SVG (בדיקה: `.svg` ב-URL). ממומש דרך CSS `mask-image` על `<div>`/`<span>` ממולא ב-`background-color`, **לא** על ה-`<img>` עצמו (מיסוך אלמנט מוחלף לא "צובע" את הפיקסלים, רק חותך שקיפות). ה-mask חייב להצביע על URL **same-origin** (proxy דרך `getBrandingPreviewUrl`, לא ה-URL הגולמי מ-R2) — אחרת הדפדפן מפיל את המסכה בשקט (ללא שגיאת console), כי גישה לפיקסלי מסכה cross-origin נחסמת כמו canvas tainting.

5. **`srcDoc` iframes הם same-origin** (יורשים את המקור של ההורה) — כלומר אם ממשיכים להשתמש ב-iframe בכלל, אפשר לקרוא את גובה התוכן שלו ישירות (`iframe.contentDocument.body.scrollHeight` + `ResizeObserver`), בלי פרוטוקול `postMessage`.

---

## מה כבר בוצע בפועל (השיחה הקודמת)

### Phase 1 — איחוד מקור אמת לערכת classic בלבד (בוצע, נבדק, **commit מקומי בלבד, לא נדחף**: `8130824`)
תוקנו שני באגים אמיתיים שנמצאו:
- **צבע טקסט ניווט לא עקבי**: `generateSiteNavStyles()` (ב-`lib/photographer-site-chrome.ts`) קיבלה פרמטר `transparentNav` חדש — עכשיו תומכת נכון בשני מצבים: טקסט לבן→כהה בגלילה (לעמודים עם hero: דף בית, פוסט בודד בבלוג), טקסט כהה קבוע (לעמודים בלי hero: תיק עבודות, רשימת בלוג, לפני/אחרי). קודם כל הדפים קיבלו את אותה התנהגות בלי קשר אם יש hero.
- **פונט "Great Vibes" (קורסיבי) חסר בחלק מהדפים**: הועבר לפונקציה משותפת `classicSectionScriptCss()` באותו קובץ — קודם היה מוגדר בנפרד (מועתק) ב-3 קבצים, וזו הסיבה שהוא "נעלם" מתיק עבודות/בלוג.
- קבצים ששונו: `lib/photographer-site-chrome.ts`, `lib/homepage-themes/classic.ts`, `lib/homepage-themes/generate-homepage-html.ts`, `lib/public-gallery-html.ts`, `lib/public-blog-html.ts`, `lib/public-portfolio-html.ts`.
- **לא נגעו**: elegant/modern/dark (בכוונה, בלי בדיקה שם), וגם לא איחוד ה-Tailwind config/spacing המלא של כל head (התגלה שדפים שונים משתמשים בערכי spacing שונים בפועל תחת אותם שמות מפתח — איחוד עיוור עלול לשבור ריווחים קיימים; לא בוצע).

### Phase 2 — קומפוננטות React ל-classic (נבנו, **לא מחוברות לשום דבר, אפס סיכון לאתר החי**)
נבנו 3 קבצים חדשים, שלא נקראים משום מקום עדיין:
- `components/photographer/site-chrome/ClassicSiteHeader.tsx` — header React אמיתי לערכת classic: תפריט נייד (`useState`), מעבר שקוף↔אטום בגלילה (`useEffect`+scroll listener עם cleanup), `next/link` במקום `target="_parent"`, צבע דינמי דרך `--nav-accent` CSS var, לוגו צבוע מדויק (בדיקת SVG, מסכה same-origin, מדידת יחס-ממדים אמיתי). **חשוב**: קובע `transparentAtTop` בעצמו דרך `usePathname()` (השוואה מול `homepagePath`/`blogPath`) — לא כ-prop חיצוני — כי הרכיב הזה אמור להיות persistent (רכיב אחד שנשאר מותקן לאורך כל הניווט, לא נטען מחדש בכל דף), אז הוא לא יכול "לקבל דרך prop" באיזה עמוד הוא נמצא מכל דף בנפרד. יש גם טיפול מפורש באיפוס `mobileOpen`/`scrolled` בכל שינוי route (כי state שלא מתאפס = "נדבק" אחרי ניווט מהיר — זו הייתה דרישת בדיקה מפורשת בתוכנית המקורית).
- `components/photographer/site-chrome/ClassicSiteFooter.tsx` — footer React מקביל, גם עם צבע דינמי דרך CSS var.
- `components/photographer/site-chrome/HtmlContentFrame.tsx` — חלופה ל-`HtmlFramePage.tsx` (**לא נגעו ב-`HtmlFramePage.tsx` המקורי בכלל** — elegant/modern/dark ממשיכים להשתמש בו ללא שינוי): iframe שמתאים את עצמו לגובה התוכן האמיתי (`ResizeObserver` על `contentDocument.body`) במקום `100vh` קבוע עם גלילה פנימית — כדי שעמוד חיצוני persistent (header+footer) יוכל לעטוף אותו כמו div רגיל.

**ה-3 קבצים האלה כן רלוונטיים לבנייה מחדש** — אפשר להשתמש בהם כנקודת התחלה/השראה ל-`themes/classic/` (אם כי עכשיו הכיוון הוא מבנה תיקיות אחר לגמרי, אז יכול להיות שצריך להעביר/לשכתב אותם למקום החדש).

---

## מבנה תיקיות שהוצע (טרם אושר סופית — ראו שאלות פתוחות)

```
lib/site-themes/
  classic/   homepage.ts, portfolio.ts, blog.ts, before-after.ts, gallery.ts, styles.ts
  elegant/   (אותו מבנה)
  modern/    (אותו מבנה)
  dark/      (אותו מבנה)
  shared/    chrome.ts (רק מה שבאמת חוצה ערכות)

components/photographer/
  themes/classic/   SiteHeader.tsx, SiteFooter.tsx, ...
  themes/elegant/   (אותו מבנה)
  themes/modern/    (אותו מבנה)
  themes/dark/      (אותו מבנה)
  shared/           HtmlContentFrame.tsx, HtmlFramePage.tsx (אם עוד נחוצים)
```

זה היה מוצע במסגרת "refactor הדרגתי של הקיים" — Lea אישרה את הכיוון הזה ברמה העקרונית, אבל אז שינתה גישה ל"בנייה מחדש בצד" (ראו למעלה). **המבנה עצמו (תיקייה לכל ערכה) כן רלוונטי גם לגישה החדשה** — רק שעכשיו זה קוד חדש, לא מיגרציה של קוד קיים.

---

## שאלות פתוחות — לסגור עם Lea בתחילת השיחה החדשה, לפני כתיבת קוד

1. **היקף הבנייה מחדש**: האם הכוונה היא *רק* header/footer (כמו Phase 2 המקורי), או **גם תוכן העמודים עצמם** (הירו, גלריה, חבילות, אודות וכו') ב-React אמיתי, לא רק HTML גולמי בתוך iframe? מהניסוח שלה ("4 ערכות מופרדות... סקשן גלריות משותף... סדר מופתי ובלי אלפי שורות קוד") — נשמע כמו **תוכן מלא**, לא רק header/footer. זה שינוי היקף גדול משמעותית, וכדאי לוודא במפורש.
2. **אילו סקשנים בדיוק משותפים בין הערכות** — היא אמרה: גלריות ✅, תמונות אחרונות ✅, בלוג ✅, תגובות/המלצות "כנראה אבל לא בטוחה" ❓. לוודא אחד-אחד לפני שבונים קומפוננטה "משותפת" (הירו? אודות? חבילות? יצירת קשר? FAQ? לפני/אחרי?).
3. **מנגנון ה-theming**: CSS custom properties (כמו ב-`ClassicSiteHeader.tsx` שכבר נבנה) הוא הדפוס המומלץ — לאשר שזו הדרך שהיא רוצה, או שיש לה מנגנון אחר בראש (theme config object שמועבר כ-props? קובץ theme נפרד לכל ערכה עם design tokens?).
4. **האם ה-iframe נשאר בכלל, או שהמעבר הוא ל-React אמיתי גם לתוכן** — אם התוכן עצמו עובר ל-React, אולי אין יותר צורך ב-iframe בשום שלב, מה שהופך את `HtmlContentFrame.tsx`/`HtmlFramePage.tsx` ללא רלוונטיים. זה תלוי בתשובה לשאלה 1.
5. **מה לגבי ה-3 קבצים שכבר נבנו** (`ClassicSiteHeader.tsx`, `ClassicSiteFooter.tsx`, `HtmlContentFrame.tsx`) — להשתמש בהם כבסיס במיקום החדש, או להתחיל מאפס עם הבנה מלאה יותר של ההיקף?
6. **סדר עבודה**: להתחיל מ-classic (כמו שהוסכם ל-Phase 1/2), או שעכשיו שזו בנייה מקבילה (לא נוגעת בקיים), אין סיבה לא להתחיל בכל 4 הערכות יחד/במקביל?

---

## הערות תהליך חשובות מהשיחה עד כה

- Lea היא הבעלים/מפתחת של הפרויקט (לא רק מזמינת עבודה) — יש לה ידע טכני אמיתי (בנתה בעבר אתר ב-React בפרויקט גמר, ותיארה במדויק את הפתרון הסטנדרטי ל"header קבוע + spacer div + footer בזרימה רגילה" כשהצעתי משהו מסובך מדי).
- דפוס עבודה שהוכח: לבדוק כל דבר בקוד בפועל (לא לנחש), לדווח ממצאים בכנות (כולל תיקון עצמי כשטעיתי), לעצור ולשאול לפני שינויים גדולים/מסוכנים, ולוודא scope לפני commit (יש לה עבודה מקבילה משלה בריפו — custom domains, R2 edge signing וכו' — **אף פעם לא לעשות `git add -A`, רק לצרף קבצים ספציפיים ששייכים למשימה**).
- `git commit` רק לבקשה מפורשת. `git push` **רק** לבקשה מפורשת נפרדת — היא ביקשה כמה פעמים "רק מקומי, אל תדחוף" ופעם אחת עצרה push בגלל דגלי סביבה רגישים (billing) שלא רצתה שיעלו ל-production בטעות.
- כל תקשורת בעברית בלבד (זו הנחיה קבועה בזיכרון של המשתמשת).
