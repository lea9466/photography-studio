-- Private galleries subscription product: fully independent from the existing
-- public-site Free/Pro subscription. Reuses subscriptions/subscription_plans
-- (product discriminator column) instead of a parallel table, and adds a
-- small dynamic config table (private_gallery_tiers) so gallery/photo quotas
-- are editable from /manage without a deploy, mirroring how subscription_plans
-- already makes price editable via app/api/admin/plans.

begin;

alter table public.subscription_plans
  add column product text not null default 'public_site'
    check (product in ('public_site', 'private_galleries'));

alter table public.subscriptions
  add column product text not null default 'public_site'
    check (product in ('public_site', 'private_galleries'));

alter table public.users
  add column free_private_gallery_created boolean not null default false;

alter table public.users
  add column private_gallery_tier_override text not null default 'auto'
    check (private_gallery_tier_override in ('auto', 'free', 'starter', 'pro', 'unlimited'));

comment on column public.users.free_private_gallery_created is
  'Lifetime flag: true once this account has ever created one private (client) gallery on the FREE private-gallery tier. Never cleared on delete — prevents delete-and-recreate abuse of the free slot.';
comment on column public.users.private_gallery_tier_override is
  'Platform-admin override for the private-gallery subscription product, independent of subscription_tier_override (public site).';

-- Backfill: accounts that already had a client gallery before this feature
-- shipped should not get an extra free slot on top of what they already used.
update public.users
set free_private_gallery_created = true
where id in (select distinct user_id from public.galleries where gallery_type = 'selection');

insert into public.subscription_plans (code, name, description, amount_agorot, currency, billing_interval, product)
values
  ('private_gallery_starter', 'גלריות פרטיות · Starter', 'עד 8 גלריות פרטיות במקביל, עד 400 תמונות לגלריה', 4900, 'ILS', 'month', 'private_galleries'),
  ('private_gallery_pro', 'גלריות פרטיות · Pro', 'עד 16 גלריות פרטיות במקביל, עד 850 תמונות לגלריה', 8900, 'ILS', 'month', 'private_galleries'),
  ('private_gallery_unlimited', 'גלריות פרטיות · Unlimited', 'עד 35 גלריות פרטיות במקביל, עד 1500 תמונות לגלריה', 14900, 'ILS', 'month', 'private_galleries')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Dynamic per-tier quota config. This is what makes gallery/photo caps
-- editable from /manage without a deploy — subscription_plans already covers
-- price/name for the 3 paid tiers, but has no gallery/photo quota columns and
-- no row at all for the free tier (free = "no active subscription").
-- ---------------------------------------------------------------------------
create table public.private_gallery_tiers (
  id uuid primary key default gen_random_uuid(),
  tier text not null unique check (tier in ('free', 'starter', 'pro', 'unlimited')),
  plan_id uuid references public.subscription_plans (id) on delete set null,
  max_galleries integer not null check (max_galleries > 0),
  max_photos_per_gallery integer not null check (max_photos_per_gallery > 0),
  is_lifetime_cap boolean not null default false,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.private_gallery_tiers is
  'Dynamic gallery-count/photo-count quotas per private-gallery tier, editable from /manage. tier and is_lifetime_cap are structural (not exposed to admin editing) — only max_galleries/max_photos_per_gallery are.';
comment on column public.private_gallery_tiers.plan_id is
  'Linked subscription_plans row for price display. Null for the free tier, which has no billing plan.';
comment on column public.private_gallery_tiers.is_lifetime_cap is
  'True only for the free tier: max_galleries counts lifetime gallery creations, not concurrently-existing ones, so deleting a gallery never frees a new slot.';

create trigger private_gallery_tiers_set_updated_at
  before update on public.private_gallery_tiers
  for each row execute function public.set_updated_at();

insert into public.private_gallery_tiers (tier, plan_id, max_galleries, max_photos_per_gallery, is_lifetime_cap, display_order)
select 'free', null, 1, 400, true, 0
union all
select 'starter', id, 8, 400, false, 1 from public.subscription_plans where code = 'private_gallery_starter'
union all
select 'pro', id, 16, 850, false, 2 from public.subscription_plans where code = 'private_gallery_pro'
union all
select 'unlimited', id, 35, 1500, false, 3 from public.subscription_plans where code = 'private_gallery_unlimited';

alter table public.private_gallery_tiers enable row level security;

create policy "private_gallery_tiers_select_all"
  on public.private_gallery_tiers for select
  to authenticated
  using (true);

revoke all on table public.private_gallery_tiers from anon, authenticated;
grant select on table public.private_gallery_tiers to authenticated;

commit;
