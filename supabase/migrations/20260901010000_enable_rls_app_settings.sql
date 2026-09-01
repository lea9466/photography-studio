-- Supabase Security Advisor: RLS Disabled in Public — public.app_settings.
-- This table is only ever read/written via the admin (service-role) client
-- (lib/public-site/react-rollout.ts, lib/actions/admin.actions.ts, both
-- gated behind requireAdmin() for writes) — never via the anon/authenticated
-- client — so enabling RLS with no grants to anon/authenticated closes the
-- hole with zero behavior change. service_role bypasses RLS regardless.

begin;

alter table public.app_settings enable row level security;

revoke all on table public.app_settings from anon, authenticated;

commit;
