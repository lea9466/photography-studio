-- ═══════════════════════════════════════════════════════════════
-- מנהל פלטפורמה: Supabase Auth + שורה ב-users (role = platform_admin)
-- Supabase → SQL Editor → ערכו אימייל/סיסמה → Run
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email    text := 'admin@example.com';  -- ← עדכנו לאימייל האמיתי
  v_password text := 'ChangeMe123!';       -- ← עדכנו לסיסמה
  v_auth_uid uuid;
BEGIN
  SELECT id INTO v_auth_uid FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;

  -- auth_id ישן ב-users שלא קיים יותר ב-auth.users — ניצור/נקשר מחדש לפי אימייל
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

  IF EXISTS (
    SELECT 1 FROM users WHERE role = 'platform_admin' AND lower(email) = lower(v_email)
  ) THEN
    UPDATE users
    SET auth_id = v_auth_uid, email = v_email, role = 'platform_admin'
    WHERE role = 'platform_admin' AND lower(email) = lower(v_email);
  ELSIF EXISTS (SELECT 1 FROM users WHERE role = 'platform_admin') THEN
    UPDATE users
    SET auth_id = v_auth_uid, email = v_email, role = 'platform_admin'
    WHERE role = 'platform_admin';
  ELSE
    INSERT INTO users (id, auth_id, email, role)
    VALUES (gen_random_uuid(), v_auth_uid, v_email, 'platform_admin');
  END IF;
END $$;

-- בדיקה:
SELECT u.id, u.email, u.role, u.auth_id, au.email AS auth_email
FROM users u
LEFT JOIN auth.users au ON au.id = u.auth_id
WHERE u.role = 'platform_admin';
