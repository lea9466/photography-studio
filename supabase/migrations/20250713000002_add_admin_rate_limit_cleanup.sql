-- Probabilistic cleanup for public.admin_rate_limits, folded into
-- admin_rate_limit_check() itself (no pg_cron dependency — see discussion:
-- pg_cron is not actually enabled in this project, only mentioned as an
-- optional, unapplied comment in 20250708000003_cleanup_orphaned_photos.sql).
--
-- redefines admin_rate_limit_check() from 20250713000001_add_admin_rate_limits.sql
-- (that migration already ran in production and is left untouched — this
-- is a plain CREATE OR REPLACE FUNCTION with the same name/signature, so
-- existing grants on the function are preserved automatically).

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
  -- ~1% of calls also delete rows that expired over an hour ago. This is a
  -- SEPARATE statement (SQL-language functions support a sequence of
  -- statements; only the last one's result is returned), not a second
  -- data-modifying CTE sharing the WITH block with the upsert below.
  -- Deliberately kept separate: Postgres raises "tuple to be updated or
  -- deleted was already modified by an operation triggered by the current
  -- command" if two data-modifying CTEs in the SAME WITH clause happen to
  -- touch the same row — which could actually happen here, since p_key's
  -- own row could itself be the stale row being cleaned up (e.g. the first
  -- request from a key that's been idle for over an hour). Running it as
  -- an earlier, separate statement in the same function call means it
  -- fully completes first, so the upsert statement below always operates
  -- on a consistent, already-cleaned view — same RPC call from the app,
  -- so this adds zero extra network round trips.
  delete from public.admin_rate_limits
  where random() < 0.01
    and reset_at < now() - interval '1 hour';

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

-- Grants are preserved by CREATE OR REPLACE FUNCTION, but re-asserting them
-- here keeps this migration self-contained and safe to read in isolation.
revoke all on function public.admin_rate_limit_check(text, integer, integer) from public;
grant execute on function public.admin_rate_limit_check(text, integer, integer) to service_role;
