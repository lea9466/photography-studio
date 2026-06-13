-- סיומת קובץ מקור ב-R2 (jpg, png…) — לבניית URL דינמי בגלריה
-- Supabase → SQL Editor → Run
--
-- זרימת העלאה חדשה: שורה נשמרת בלי URL (null) → העלאה ל-R2 → כתובות נבנות מ-id + album_id + original_ext

ALTER TABLE images ADD COLUMN IF NOT EXISTS original_ext text;

-- תמונות חדשות נשמרות בלי URL מלא — רק מזהה + סיומת; ה-URL נבנה דינמית מ-R2
ALTER TABLE images ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE images ALTER COLUMN thumbnail_url DROP NOT NULL;

-- תמונות ישנות: נסה לגזור מ-image_url, אחרת jpg
UPDATE images
SET original_ext = lower(
  regexp_replace(
    coalesce(
      nullif(substring(image_url from '\.([a-zA-Z0-9]+)(?:\?|$)'), ''),
      nullif(substring(thumbnail_url from '\.([a-zA-Z0-9]+)(?:\?|$)'), ''),
      'jpg'
    ),
    '[^a-z0-9]',
    '',
    'g'
  )
)
WHERE original_ext IS NULL OR trim(original_ext) = '';

NOTIFY pgrst, 'reload schema';
