-- Pay-per-gallery "gallery pass": a one-time purchase that lets a photographer
-- without an active private-gallery subscription create ONE client gallery,
-- with a bought photo cap and a time-limited client-access window. Distinct
-- from the recurring private_gallery tiers (lib/private-galleries) — a pass is
-- a single charge tied to a single gallery, for the occasional user.
--
-- The bundle catalogue lives in its own table (price + cap + validity in one
-- row) so all three are editable from /manage without a deploy — same reason
-- private_gallery_tiers is a separate table. The "over 1500 — contact me" row
-- is a UI link, not a bundle.

begin;

create table public.gallery_pass_bundles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  photo_cap integer not null check (photo_cap > 0),
  validity_days integer not null check (validity_days > 0),
  amount_agorot integer not null check (amount_agorot > 0),
  currency text not null default 'ILS',
  display_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.gallery_pass_bundles is
  'Catalogue of one-time gallery-pass bundles (photo cap + client-window length + price), editable from /manage. photo_cap counts regular + edited photos together.';

create trigger gallery_pass_bundles_set_updated_at
  before update on public.gallery_pass_bundles
  for each row execute function public.set_updated_at();

insert into public.gallery_pass_bundles (code, name, photo_cap, validity_days, amount_agorot, display_order)
values
  ('gallery_pass_100',  'עד 100 תמונות',  100,  21,  700, 0),
  ('gallery_pass_300',  'עד 300 תמונות',  300,  21, 1200, 1),
  ('gallery_pass_800',  'עד 800 תמונות',  800,  21, 2000, 2),
  ('gallery_pass_1500', 'עד 1500 תמונות', 1500, 21, 2800, 3);

-- Pass state on the gallery it was bought for. All nullable: a gallery with a
-- null pass_bundle_id is a normal subscription/free-tier gallery. cap and
-- validity are SNAPSHOT at purchase so a later bundle edit never retroactively
-- shrinks or shortens a gallery someone already paid for.
alter table public.galleries
  add column pass_bundle_id uuid references public.gallery_pass_bundles (id) on delete set null,
  add column pass_photo_cap integer check (pass_photo_cap is null or pass_photo_cap > 0),
  add column pass_validity_days integer check (pass_validity_days is null or pass_validity_days > 0),
  add column pass_purchased_at timestamptz,
  add column pass_expiry_reminder_sent_at timestamptz;

comment on column public.galleries.pass_photo_cap is
  'Snapshot of the bought bundle''s photo_cap. When set, it overrides the owner''s private-gallery tier cap for this gallery (see assertPrivateGalleryPhotoCountWithinLimit).';
comment on column public.galleries.pass_purchased_at is
  'When the gallery pass was paid. Null = pass selected but not yet paid — uploads and send-to-client stay blocked, and an abandoned unpaid draft is cleaned up by cron.';

-- A partial index for the cleanup + expiry crons (small set: only pass galleries).
create index galleries_pass_bundle_id_idx
  on public.galleries (pass_bundle_id)
  where pass_bundle_id is not null;

alter table public.gallery_pass_bundles enable row level security;

create policy "gallery_pass_bundles_select_active"
  on public.gallery_pass_bundles for select
  to authenticated
  using (is_active = true);

revoke all on table public.gallery_pass_bundles from anon, authenticated;
grant select on table public.gallery_pass_bundles to authenticated;

commit;
