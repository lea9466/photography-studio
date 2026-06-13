-- ═══════════════════════════════════════════════════════════════
-- בדיקת תצורת Auth (קריאה בלבד) — Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- 1) מנהל פלטפורמה: users.role + קישור ל-auth.users
SELECT
  'platform_admin' AS check_type,
  u.email,
  u.auth_id,
  au.email AS auth_email,
  CASE
    WHEN au.id IS NULL THEN 'FAIL — auth_id לא קיים ב-auth.users (הריצו platform-admin-auth.sql)'
    WHEN lower(u.email) IS DISTINCT FROM lower(au.email) THEN 'WARN — אימייל ב-users שונה מ-auth.users'
    ELSE 'OK'
  END AS status
FROM users u
LEFT JOIN auth.users au ON au.id = u.auth_id
WHERE u.role = 'platform_admin';

-- 2) צלמים: photographers.auth_user_id
SELECT
  'photographer' AS check_type,
  p.slug,
  p.email,
  p.auth_user_id,
  au.email AS auth_email,
  CASE
    WHEN p.auth_user_id IS NULL THEN 'FAIL — חסר auth_user_id'
    WHEN au.id IS NULL THEN 'FAIL — auth_user_id לא קיים ב-auth.users'
    ELSE 'OK'
  END AS status
FROM photographers p
LEFT JOIN auth.users au ON au.id = p.auth_user_id
ORDER BY p.slug;

-- 3) טבלת rate-limit ללקוחות (שכחתי קוד)
SELECT
  'password_reset_tokens' AS check_type,
  CASE
    WHEN to_regclass('public.password_reset_tokens') IS NOT NULL THEN 'OK'
    ELSE 'MISSING — הריצו password-reset.sql'
  END AS status;
