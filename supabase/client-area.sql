-- אזור לקוח: הריצי ב-Supabase → SQL Editor → Run
-- מוסיף קוד גישה ללקוח (להתחברות לפי אימייל + קוד) וטוקן סודי לכל אלבום (קישור ישיר).

-- קוד גישה — נשמר בטבלת users ליד האימייל. הלקוח מתחבר עם אימייל + קוד
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_code text;

-- טוקן סודי לאלבום — לשליחת קישור ישיר במייל (/g/<token>)
ALTER TABLE albums ADD COLUMN IF NOT EXISTS access_token text;

CREATE UNIQUE INDEX IF NOT EXISTS albums_access_token_key
  ON albums (access_token)
  WHERE access_token IS NOT NULL;

-- מילוי טוקנים לאלבומים קיימים (ייווצר אוטומטית גם מהאדמין בשמירה)
UPDATE albums
SET access_token = encode(gen_random_bytes(18), 'hex')
WHERE access_token IS NULL;

-- רענון מטמון הסכימה של PostgREST (אם מופיעה שגיאת "schema cache")
NOTIFY pgrst, 'reload schema';

-- הערה: גישת אזור הלקוח עוברת דרך השרת עם service-role (כמו /admin),
-- כך שאין צורך במדיניות RLS חדשה ל-images / image_selections / download_logs.
-- selection_type בשימוש: 'album' (תמונות לאלבום) ו-'edit' (תמונות לעיבוד).
