-- Studio Gallery — platform-admin subscription tier override
-- Adds the single column required for the Free/Pro entitlement system.
-- Nothing else is modified: no trial dates, no billing data, no user content.

begin;

alter table public.users
  add column if not exists subscription_tier_override text not null default 'auto'
  check (subscription_tier_override in ('auto', 'pro', 'free'));

comment on column public.users.subscription_tier_override is
  'Platform-admin entitlement override: auto = trial/subscription based, pro/free = forced.';

commit;
