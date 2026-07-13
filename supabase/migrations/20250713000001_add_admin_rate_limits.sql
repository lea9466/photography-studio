-- Persistent, atomic rate limiting for admin OTP requests.
--
-- Replaces the in-memory limiter (lib/rate-limit/gallery-password.ts) for
-- this specific flow only — Vercel serverless functions do not share
-- process memory across invocations/instances, so an in-memory counter
-- is not reliably enforced in production for a security-sensitive flow
-- like admin login. gallery-password.ts itself is left untouched and
-- still used elsewhere.

create table if not exists public.admin_rate_limits (
  key text primary key,
  count integer not null default 1,
  reset_at timestamptz not null
);

comment on table public.admin_rate_limits is
  'Generic keyed rate-limit counters (e.g. "admin-otp-request:ip:1.2.3.4"). Rows are transient and safe to delete once expired.';

-- This project's default privileges (see 20250614000005_grants.sql) grant
-- ALL on every new table to `authenticated` and SELECT/INSERT to `anon` —
-- without RLS, any logged-in studio owner could read/tamper with every
-- rate-limit row (including deleting their own to bypass the limiter
-- entirely) via the PostgREST API, and `anon` could read/insert rows too.
-- Enabling RLS with zero policies denies all access by default to every
-- role except one with the BYPASSRLS attribute. `service_role` has
-- BYPASSRLS built in, and admin_rate_limit_check() runs SECURITY DEFINER
-- (as the function owner, effectively a superuser-like context that is
-- also exempt from RLS), so the existing RPC-based flow in
-- lib/actions/admin.actions.ts keeps working with no code changes.
alter table public.admin_rate_limits enable row level security;

-- Belt-and-suspenders: explicitly revoke the default-privilege grants too,
-- in case RLS is ever accidentally disabled or a future migration adds a
-- permissive policy. service_role is unaffected (BYPASSRLS + not listed).
revoke all on table public.admin_rate_limits from anon, authenticated;

-- Single atomic upsert: initializes/resets an expired window, blocks once
-- count reaches p_max_attempts, otherwise increments — all in ONE
-- statement (INSERT ... ON CONFLICT ... DO UPDATE ... WHERE ... RETURNING)
-- so there is no separate read-then-write round trip from the application.
-- The row lock Postgres takes for the conflicting row during ON CONFLICT
-- DO UPDATE serializes concurrent callers on the same key, which is what
-- makes this race-free (see scripts/test-rate-limit-concurrency.mjs).
create or replace function public.admin_rate_limit_check(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language sql
security definer
set search_path = public
as $$
  with upsert as (
    insert into public.admin_rate_limits as r (key, count, reset_at)
    values (p_key, 1, now() + make_interval(secs => p_window_seconds))
    on conflict (key) do update
      set
        count = case
          when r.reset_at <= now() then 1
          else r.count + 1
        end,
        reset_at = case
          when r.reset_at <= now() then now() + make_interval(secs => p_window_seconds)
          else r.reset_at
        end
      -- If neither condition holds (not expired AND already at/over the
      -- limit), the update is skipped entirely and this row is NOT
      -- returned by RETURNING below — that's how we detect "blocked".
      where r.reset_at <= now() or r.count < p_max_attempts
    returning count, reset_at
  )
  select
    true as allowed,
    greatest(p_max_attempts - u.count, 0) as remaining,
    0 as retry_after_seconds
  from upsert u
  union all
  select
    false as allowed,
    0 as remaining,
    greatest(ceil(extract(epoch from (r.reset_at - now())))::integer, 0) as retry_after_seconds
  from public.admin_rate_limits r
  where r.key = p_key
    and not exists (select 1 from upsert)
  limit 1;
$$;

revoke all on function public.admin_rate_limit_check(text, integer, integer) from public;
grant execute on function public.admin_rate_limit_check(text, integer, integer) to service_role;

-- Cleanup of expired rows is intentionally NOT included in this migration —
-- see the discussion with the user about pg_cron availability before adding it.
