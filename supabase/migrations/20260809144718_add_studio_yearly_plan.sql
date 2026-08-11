-- Proposed only: adds the yearly subscription plan catalog row.
-- Do not apply without explicit approval.
-- Prices are server-authoritative; clients never send amount/interval.

insert into public.subscription_plans (
  code,
  name,
  description,
  amount_agorot,
  currency,
  billing_interval,
  is_active
)
values (
  'studio_yearly',
  'מנוי שנתי',
  'מנוי שנתי ל-Studio Gallery',
  40000,
  'ILS',
  'year',
  true
)
on conflict (code) do nothing;
