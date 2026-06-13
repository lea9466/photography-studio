-- slug ייחודי לכל צלם — לנתיבי multi-tenant: /{slug}/...
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS slug text;

-- מילוי slug קיים: חלק לפני @ באימייל, או מזהה קצר
UPDATE photographers
SET slug = lower(regexp_replace(split_part(coalesce(email, id::text), '@', 1), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR trim(slug) = '';

UPDATE photographers
SET slug = 'studio-' || substr(replace(id::text, '-', ''), 1, 8)
WHERE slug IS NULL OR trim(slug) = '';

ALTER TABLE photographers ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS photographers_slug_key ON photographers (slug);

-- קריאה ציבורית של slug (לזיהוי tenant ב-anon)
DROP POLICY IF EXISTS "Public read photographer slug" ON photographers;
CREATE POLICY "Public read photographer slug" ON photographers
  FOR SELECT TO anon, authenticated USING (true);

NOTIFY pgrst, 'reload schema';
