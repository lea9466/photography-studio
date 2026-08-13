-- Trial-expired (day-zero) notification dedupe column. Separate from
-- trial_ending_email_sent_at (the "ending soon" reminder) since these are two
-- distinct emails with independent send windows.

begin;

alter table public.users
  add column if not exists trial_expired_email_sent_at timestamptz;

comment on column public.users.trial_expired_email_sent_at is
  'Timestamp used to prevent duplicate trial-expired (moved to FREE) notification emails';

commit;
