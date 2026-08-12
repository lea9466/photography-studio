-- Adds pricing-display fields to subscription_plans so the launch discount
-- (official price shown struck-through + discounted price actually charged)
-- is configurable from the admin panel instead of being hard-coded in the UI.
--
-- Prices remain server-authoritative: clients never send amount/interval, and
-- the charged price is still `amount_agorot` (the discount price). The new
-- `compare_at_amount_agorot` is display-only (the "real" price for the
-- strike-through), `badge` is a short label, and `is_highlighted` emphasizes
-- a plan card (e.g. the yearly plan).
--
-- Idempotent: columns are added with IF NOT EXISTS and the seed uses
-- code-specific updates so re-running is safe.

alter table public.subscription_plans
  add column if not exists compare_at_amount_agorot integer
    check (compare_at_amount_agorot is null or compare_at_amount_agorot > 0),
  add column if not exists badge text,
  add column if not exists is_highlighted boolean not null default false;

comment on column public.subscription_plans.compare_at_amount_agorot is
  'Display-only "official" price shown struck-through next to the charged price. Null = no discount shown.';
comment on column public.subscription_plans.badge is
  'Short label shown on the plan card (e.g. "מחיר השקה מיוחד", "הכי משתלם").';
comment on column public.subscription_plans.is_highlighted is
  'When true the plan card is visually emphasized in the selection UI.';

-- Launch pricing seed (idempotent per plan code):
--   חודשי: 40 ₪ הרשמי -> 34.90 ₪ בפועל
--   שנתי: 400 ₪ הרשמי -> 349 ₪ בפועל, מודגש ("הכי משתלם")
update public.subscription_plans
set
  amount_agorot = 3490,
  compare_at_amount_agorot = 4000,
  badge = 'מחיר השקה מיוחד'
where code = 'studio_monthly';

update public.subscription_plans
set
  compare_at_amount_agorot = 40000,
  badge = 'הכי משתלם',
  is_highlighted = true
where code = 'studio_yearly';
