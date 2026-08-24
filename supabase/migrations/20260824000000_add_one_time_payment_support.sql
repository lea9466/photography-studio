-- One-time payment support for customers whose card cannot hold a recurring
-- authorization (e.g. immediate-debit "דיירקט" cards) — a single SUMIT charge
-- with no standing authorization, instead of the regular monthly/yearly
-- recurring subscription. Additive only.
--
-- The index on (current_period_end) is intentionally NOT in this file — see
-- 20260824000001_add_one_time_payment_period_end_index.sql. Plain CREATE
-- INDEX takes a SHARE lock that blocks writes on `subscriptions` for the
-- build's duration; CREATE INDEX CONCURRENTLY avoids that, but cannot run
-- inside a transaction block at all, so it cannot live in this begin/commit.

begin;

-- Fails fast instead of queuing behind a long-running query/transaction and
-- blocking every later request on `subscriptions` behind it.
set local lock_timeout = '4s';

alter table public.subscriptions
  add column if not exists payment_type text not null default 'recurring'
    check (payment_type in ('recurring', 'one_time')),
  add column if not exists one_time_reminder_sent_at timestamptz,
  add column if not exists one_time_expired_email_sent_at timestamptz;

comment on column public.subscriptions.payment_type is
  'recurring = standing provider authorization renews automatically; one_time = single charge, current_period_end lapses with no further billing.';
comment on column public.subscriptions.one_time_reminder_sent_at is
  'Timestamp used to prevent duplicate "3 days left" one-time-payment reminder emails.';
comment on column public.subscriptions.one_time_expired_email_sent_at is
  'Timestamp used to prevent duplicate "moved to free plan" one-time-payment notification emails.';

commit;
