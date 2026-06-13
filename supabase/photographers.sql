-- מולטי-טננט: צלמים (מנוי) + קישור לכל הנתונים
-- הריצי ב-Supabase → SQL Editor → Run (בלוק אחד)
--
-- דרישה מוקדמת: חייב להיות לפחות משתמש אחד ב-Authentication
-- עם שורה מתאימה ב-users (role = 'admin', auth_id = auth.users.id).
-- אם אין — צרי משתמש ב-Auth, הוסיפי שורה ב-users, ואז הריצי שוב.

-- ─────────────────────────────────────────────────────────────
-- 1) טבלת photographers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photographers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  email text,
  slug text,
  subscription_status text NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'trial', 'past_due', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE photographers ADD COLUMN IF NOT EXISTS slug text;

CREATE INDEX IF NOT EXISTS photographers_auth_user_id_idx
  ON photographers (auth_user_id);

-- ─────────────────────────────────────────────────────────────
-- 2) עמודת photographer_id (nullable בשלב ראשון — למילוי)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS photographer_id uuid;

ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS photographer_id uuid;

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS photographer_id uuid;

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS photographer_id uuid;

-- ─────────────────────────────────────────────────────────────
-- 3) צלם ברירת מחדל + שיוך נתונים קיימים
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  default_photographer_id uuid;
  auth_uid uuid;
  admin_email text;
  studio_name text;
BEGIN
  SELECT u.auth_id, u.email
  INTO auth_uid, admin_email
  FROM users u
  WHERE u.role = 'admin'
    AND u.auth_id IS NOT NULL
  ORDER BY u.created_at
  LIMIT 1;

  IF auth_uid IS NULL THEN
    RAISE EXCEPTION
      'לא נמצא admin עם auth_id. צרי משתמש ב-Supabase Auth, הוסיפי שורה ב-users (role=admin, auth_id=<uuid>), והריצי שוב.';
  END IF;

  SELECT business_name INTO studio_name
  FROM site_settings
  ORDER BY id
  LIMIT 1;

  INSERT INTO photographers (auth_user_id, display_name, email)
  VALUES (
    auth_uid,
    COALESCE(NULLIF(trim(studio_name), ''), 'סטודיו'),
    admin_email
  )
  ON CONFLICT (auth_user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        email = COALESCE(EXCLUDED.email, photographers.email)
  RETURNING id INTO default_photographer_id;

  IF default_photographer_id IS NULL THEN
    SELECT id INTO default_photographer_id
    FROM photographers
    WHERE auth_user_id = auth_uid;
  END IF;

  UPDATE photographers
  SET slug = lower(regexp_replace(split_part(coalesce(email, id::text), '@', 1), '[^a-z0-9]+', '-', 'g'))
  WHERE id = default_photographer_id AND (slug IS NULL OR trim(slug) = '');

  UPDATE photographers
  SET slug = 'studio-' || substr(replace(id::text, '-', ''), 1, 8)
  WHERE id = default_photographer_id AND (slug IS NULL OR trim(slug) = '');

  UPDATE clients
  SET photographer_id = default_photographer_id
  WHERE photographer_id IS NULL;

  UPDATE albums a
  SET photographer_id = default_photographer_id
  WHERE a.photographer_id IS NULL;

  -- אלבומים דרך client (אם client כבר שויך)
  UPDATE albums a
  SET photographer_id = c.photographer_id
  FROM clients c
  WHERE a.client_id = c.id
    AND a.photographer_id IS NULL
    AND c.photographer_id IS NOT NULL;

  UPDATE packages
  SET photographer_id = default_photographer_id
  WHERE photographer_id IS NULL;

  UPDATE site_settings
  SET photographer_id = default_photographer_id
  WHERE photographer_id IS NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4) FK + NOT NULL + ייחודיות site_settings לכל צלם
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_photographer_id_fkey'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_photographer_id_fkey
      FOREIGN KEY (photographer_id) REFERENCES photographers (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'albums_photographer_id_fkey'
  ) THEN
    ALTER TABLE albums
      ADD CONSTRAINT albums_photographer_id_fkey
      FOREIGN KEY (photographer_id) REFERENCES photographers (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'packages_photographer_id_fkey'
  ) THEN
    ALTER TABLE packages
      ADD CONSTRAINT packages_photographer_id_fkey
      FOREIGN KEY (photographer_id) REFERENCES photographers (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_photographer_id_fkey'
  ) THEN
    ALTER TABLE site_settings
      ADD CONSTRAINT site_settings_photographer_id_fkey
      FOREIGN KEY (photographer_id) REFERENCES photographers (id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE clients
  ALTER COLUMN photographer_id SET NOT NULL;

ALTER TABLE albums
  ALTER COLUMN photographer_id SET NOT NULL;

ALTER TABLE packages
  ALTER COLUMN photographer_id SET NOT NULL;

ALTER TABLE site_settings
  ALTER COLUMN photographer_id SET NOT NULL;

-- שורה אחת לכל צלם (במקום שורה גלובלית יחידה)
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_one_per_photographer
  ON site_settings (photographer_id);

CREATE UNIQUE INDEX IF NOT EXISTS photographers_slug_key ON photographers (slug);

CREATE INDEX IF NOT EXISTS clients_photographer_id_idx
  ON clients (photographer_id);

CREATE INDEX IF NOT EXISTS albums_photographer_id_idx
  ON albums (photographer_id);

CREATE INDEX IF NOT EXISTS packages_photographer_id_idx
  ON packages (photographer_id);

-- ─────────────────────────────────────────────────────────────
-- 5) RLS בסיסי (אופציונלי — מומלץ לפני שימוש ב-anon key)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Photographers read own row" ON photographers;
CREATE POLICY "Photographers read own row"
  ON photographers FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Public read photographer slug" ON photographers;
CREATE POLICY "Public read photographer slug"
  ON photographers FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
CREATE POLICY "Public read site_settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read albums" ON albums;
CREATE POLICY "Public read albums"
  ON albums FOR SELECT
  TO anon, authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
