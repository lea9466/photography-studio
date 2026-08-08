-- Trial-ending reminder dedupe column.
-- Prepared only. Do not apply until approved.

begin;

alter table public.users
  add column if not exists trial_ending_email_sent_at timestamptz;

comment on column public.users.trial_ending_email_sent_at is
  'Timestamp used to prevent duplicate trial-ending reminder emails';

commit;
