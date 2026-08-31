-- Shorten the free trial from 1 month to 2 weeks, and the "friend brings friend"
-- referral bonus from 30 days to 7 (see lib/referral/referral.ts).
-- Only the default for NEW signups changes here — existing rows keep whatever
-- trial_end_date they already have (an active trial is never retroactively cut).
alter table public.users
  alter column trial_end_date set default (now() + interval '14 days');

comment on column public.users.trial_end_date is
  'Trial expiry (14 days from signup); extended by referral bonuses (+7 days each)';
