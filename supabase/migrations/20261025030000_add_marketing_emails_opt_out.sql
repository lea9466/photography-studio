-- Per-studio opt-out from bulk/announcement emails ("take me off the list"),
-- without touching the account. Set = she is skipped by the /manage
-- broadcast and by every scripts/send-*-announcement.ts rollout.
-- Transactional emails (galleries, password, subscription/billing) still go.

begin;

alter table public.users
  add column if not exists marketing_emails_opted_out_at timestamptz;

comment on column public.users.marketing_emails_opted_out_at is
  'When she asked to stop receiving announcement/broadcast emails; null = subscribed. Transactional emails are unaffected.';

commit;
