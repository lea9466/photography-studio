-- Gallery-pass CREDIT model (supersedes the pay-inside-the-wizard flow): the
-- photographer buys a pass up front as a standalone purchase, which grants a
-- credit sitting on her account. She then creates a client gallery through the
-- normal full wizard and the credit is consumed silently — no payment step in
-- the creation flow. An abandoned checkout leaves a `pending` credit that the
-- daily cron cleans up; a `paid` credit never expires (the validity_days it
-- carries is the CLIENT window, which only starts once the gallery is sent).

begin;

create table public.gallery_pass_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  -- Snapshot of the bought bundle: kept even if the catalogue row is later
  -- edited or removed, so the credit is worth exactly what was paid for.
  bundle_id uuid references public.gallery_pass_bundles (id) on delete set null,
  bundle_code text not null,
  photo_cap integer not null check (photo_cap > 0),
  validity_days integer not null check (validity_days > 0),
  amount_agorot integer not null check (amount_agorot > 0),
  currency text not null default 'ILS',
  -- pending  = SUMIT checkout opened, charge not yet confirmed
  -- paid     = charge confirmed, available to attach to a new gallery
  -- consumed = attached to consumed_by_gallery_id
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'consumed')),
  purchased_at timestamptz,
  consumed_by_gallery_id uuid references public.galleries (id) on delete set null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.gallery_pass_credits is
  'A bought pay-per-gallery pass sitting on a photographer''s account, consumed when she creates a client gallery. status: pending → paid → consumed.';

create index gallery_pass_credits_user_status_idx
  on public.gallery_pass_credits (user_id, status);

create trigger gallery_pass_credits_set_updated_at
  before update on public.gallery_pass_credits
  for each row execute function public.set_updated_at();

alter table public.gallery_pass_credits enable row level security;

create policy "gallery_pass_credits_select_own"
  on public.gallery_pass_credits for select
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.gallery_pass_credits from anon, authenticated;
grant select on table public.gallery_pass_credits to authenticated;

commit;
