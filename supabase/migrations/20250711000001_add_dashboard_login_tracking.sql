ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_dashboard_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS dashboard_login_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.users.last_dashboard_login_at IS 'Last time the studio owner signed in to the dashboard';
COMMENT ON COLUMN public.users.dashboard_login_count IS 'Total number of dashboard sign-ins';

-- Backfill last login from Supabase Auth for existing studios
UPDATE public.users u
SET last_dashboard_login_at = au.last_sign_in_at
FROM auth.users au
WHERE u.id = au.id
  AND au.last_sign_in_at IS NOT NULL
  AND u.last_dashboard_login_at IS NULL;

CREATE OR REPLACE FUNCTION public.record_dashboard_login(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.users
  SET
    last_dashboard_login_at = now(),
    dashboard_login_count = dashboard_login_count + 1
  WHERE id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.record_dashboard_login(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_dashboard_login(uuid) TO service_role;
