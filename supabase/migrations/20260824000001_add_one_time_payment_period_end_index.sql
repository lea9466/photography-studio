-- Deliberately no begin;/commit; — CREATE INDEX CONCURRENTLY errors with
-- "cannot run inside a transaction block" if wrapped in one. This must be
-- applied as its own statement/connection, not batched with other migrations.
--
-- NOT verified against this project's actual migration runner (supabase
-- db push / migration up) — some runners send a whole batch of files over
-- one connection as an implicit transaction regardless of explicit
-- begin/commit in the file. Confirm this file applies cleanly on its own
-- (e.g. `psql -f` directly, or whatever the runner's docs specify for a
-- CONCURRENTLY migration) before relying on it in production. If it fails
-- with "cannot run inside a transaction block", apply it manually via a
-- direct psql connection instead of the normal migration flow.
--
-- If a CONCURRENTLY build is interrupted (connection drop, cancelled), it
-- leaves an INVALID index behind that safely does nothing but must be
-- dropped and retried: `drop index concurrently if exists
-- public.subscriptions_one_time_period_end_idx;` then rerun this file.

create index concurrently if not exists subscriptions_one_time_period_end_idx
  on public.subscriptions (current_period_end)
  where payment_type = 'one_time';
