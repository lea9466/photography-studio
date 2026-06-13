-- ═══════════════════════════════════════════════════════════════
-- הכל בבלוק אחד: Auth user + admin + photographers + שיוך נתונים
-- Supabase → SQL Editor → הדביקי הכל → Run
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── הגדרות (שני אם צריך) ──
-- אימייל וסיסמה לצלמת (התחברות ל-/admin בעתיד)
DO $$
DECLARE
  v_email       text := 'lea@studio.com';
  v_password    text := 'Studio123!';
  v_auth_uid    uuid;
  v_photographer_id uuid;
  v_studio_name text;
BEGIN
  -- 1) משתמש Auth (או קיים לפי אימייל)
  SELECT id INTO v_auth_uid FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_auth_uid IS NULL THEN
    v_auth_uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_auth_uid,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_auth_uid::text,
      v_auth_uid,
      jsonb_build_object('sub', v_auth_uid::text, 'email', v_email, 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );
  END IF;

  -- 2) שורת admin ב-users
  IF EXISTS (SELECT 1 FROM users WHERE role = 'admin' AND email = v_email) THEN
    UPDATE users SET auth_id = v_auth_uid WHERE role = 'admin' AND email = v_email;
  ELSIF EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    UPDATE users SET auth_id = v_auth_uid, email = v_email WHERE role = 'admin';
  ELSE
    INSERT INTO users (id, auth_id, email, role)
    VALUES (gen_random_uuid(), v_auth_uid, v_email, 'admin');
  END IF;

  -- 3) טבלת photographers + עמודות
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

  ALTER TABLE clients       ADD COLUMN IF NOT EXISTS photographer_id uuid;
  ALTER TABLE albums        ADD COLUMN IF NOT EXISTS photographer_id uuid;
  ALTER TABLE packages      ADD COLUMN IF NOT EXISTS photographer_id uuid;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS photographer_id uuid;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS theme_style text NOT NULL DEFAULT 'warm';

  SELECT business_name INTO v_studio_name FROM site_settings ORDER BY id LIMIT 1;

  INSERT INTO photographers (auth_user_id, display_name, email)
  VALUES (v_auth_uid, COALESCE(NULLIF(trim(v_studio_name), ''), 'סטודיו'), v_email)
  ON CONFLICT (auth_user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        email = COALESCE(EXCLUDED.email, photographers.email)
  RETURNING id INTO v_photographer_id;

  IF v_photographer_id IS NULL THEN
    SELECT id INTO v_photographer_id FROM photographers WHERE auth_user_id = v_auth_uid;
  END IF;

  UPDATE photographers
  SET slug = lower(regexp_replace(split_part(coalesce(email, id::text), '@', 1), '[^a-z0-9]+', '-', 'g'))
  WHERE id = v_photographer_id AND (slug IS NULL OR trim(slug) = '');

  UPDATE clients       SET photographer_id = v_photographer_id WHERE photographer_id IS NULL;
  UPDATE albums        SET photographer_id = v_photographer_id WHERE photographer_id IS NULL;
  UPDATE packages      SET photographer_id = v_photographer_id WHERE photographer_id IS NULL;
  UPDATE site_settings SET photographer_id = v_photographer_id WHERE photographer_id IS NULL;

  -- 4) FK (רק אם חסר)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_photographer_id_fkey') THEN
    ALTER TABLE clients ADD CONSTRAINT clients_photographer_id_fkey
      FOREIGN KEY (photographer_id) REFERENCES photographers (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'albums_photographer_id_fkey') THEN
    ALTER TABLE albums ADD CONSTRAINT albums_photographer_id_fkey
      FOREIGN KEY (photographer_id) REFERENCES photographers (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'packages_photographer_id_fkey') THEN
    ALTER TABLE packages ADD CONSTRAINT packages_photographer_id_fkey
      FOREIGN KEY (photographer_id) REFERENCES photographers (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_photographer_id_fkey') THEN
    ALTER TABLE site_settings ADD CONSTRAINT site_settings_photographer_id_fkey
      FOREIGN KEY (photographer_id) REFERENCES photographers (id) ON DELETE CASCADE;
  END IF;

  ALTER TABLE clients       ALTER COLUMN photographer_id SET NOT NULL;
  ALTER TABLE albums        ALTER COLUMN photographer_id SET NOT NULL;
  ALTER TABLE packages      ALTER COLUMN photographer_id SET NOT NULL;
  ALTER TABLE site_settings ALTER COLUMN photographer_id SET NOT NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS site_settings_one_per_photographer ON site_settings (photographer_id);

ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_theme_style_check;
ALTER TABLE site_settings
  ADD CONSTRAINT site_settings_theme_style_check
  CHECK (theme_style IN ('minimalist', 'cinematic', 'warm', 'creative'));
CREATE UNIQUE INDEX IF NOT EXISTS photographers_slug_key ON photographers (slug);
CREATE INDEX IF NOT EXISTS photographers_auth_user_id_idx ON photographers (auth_user_id);
CREATE INDEX IF NOT EXISTS clients_photographer_id_idx  ON clients (photographer_id);
CREATE INDEX IF NOT EXISTS albums_photographer_id_idx   ON albums (photographer_id);
CREATE INDEX IF NOT EXISTS packages_photographer_id_idx ON packages (photographer_id);

ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Photographers read own row" ON photographers;
CREATE POLICY "Photographers read own row" ON photographers FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read albums" ON albums;
CREATE POLICY "Public read albums" ON albums FOR SELECT TO anon, authenticated USING (true);

NOTIFY pgrst, 'reload schema';

-- בדיקה:
SELECT 'auth' AS tbl, id::text, email FROM auth.users WHERE email = 'lea@studio.com'
UNION ALL
SELECT 'photographers', id::text, email FROM photographers LIMIT 5;
