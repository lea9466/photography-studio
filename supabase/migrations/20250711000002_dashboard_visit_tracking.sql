ALTER TABLE public.users
  RENAME COLUMN last_dashboard_login_at TO last_dashboard_visit_at;

ALTER TABLE public.users
  RENAME COLUMN dashboard_login_count TO dashboard_visit_count;

COMMENT ON COLUMN public.users.last_dashboard_visit_at IS 'Last time a dashboard page was loaded';
COMMENT ON COLUMN public.users.dashboard_visit_count IS 'Total number of dashboard page loads';

CREATE OR REPLACE FUNCTION public.record_dashboard_visit(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.users
  SET
    last_dashboard_visit_at = now(),
    dashboard_visit_count = dashboard_visit_count + 1
  WHERE id = p_user_id;
$$;

DROP FUNCTION IF EXISTS public.record_dashboard_login(uuid);

REVOKE ALL ON FUNCTION public.record_dashboard_visit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_dashboard_visit(uuid) TO service_role;
