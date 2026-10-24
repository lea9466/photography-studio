-- Theme-independent hero layouts. A photographer can swap her theme's built-in
-- hero for one of the shared layouts (lib/public-site/hero-settings.ts) and
-- tune a few options, independently of the theme's colours/fonts.
--
-- users.hero_settings: NULL = the theme's own hero, exactly how every site
-- rendered before this feature — so nothing changes until she saves a layout.
--
-- hero_option_tiers: which layouts/options are free vs. PRO-only, editable
-- from /manage without a deploy (same reason gallery_pass_bundles is a table).
-- A key missing from the table falls back to the code default. The public
-- site re-checks this at render time: a studio that isn't allowed every
-- option her saved hero uses (lapsed subscription, or an option flipped to
-- PRO here) gets the theme's own hero instead.

begin;

alter table public.users
  add column if not exists hero_settings jsonb;

comment on column public.users.hero_settings is
  'Shared hero layout + options: {"layout":"cinema","pinOnScroll":false,...}. NULL = the theme''s own built-in hero.';

create table public.hero_option_tiers (
  option_key text primary key,
  tier text not null check (tier in ('free', 'pro')),
  updated_at timestamptz not null default now()
);

comment on table public.hero_option_tiers is
  'Free/PRO gate per hero layout ("layout:<id>") and per hero option, editable from /manage. Missing key = code default.';

create trigger hero_option_tiers_set_updated_at
  before update on public.hero_option_tiers
  for each row execute function public.set_updated_at();

insert into public.hero_option_tiers (option_key, tier)
values
  ('layout:cinema', 'free'),
  ('layout:split', 'free'),
  ('layout:frame', 'pro'),
  ('layout:arch', 'pro'),
  ('layout:trio', 'pro'),
  ('layout:mag', 'pro'),
  ('layout:film', 'pro'),
  ('layout:pano', 'pro'),
  ('pin_on_scroll', 'pro'),
  ('transition', 'pro'),
  ('speed', 'free'),
  ('title_size', 'pro'),
  ('shade', 'pro'),
  ('hide_eyebrow', 'free'),
  ('hide_secondary_cta', 'free'),
  ('hide_scroll_cue', 'free');

alter table public.hero_option_tiers enable row level security;

create policy "hero_option_tiers_select"
  on public.hero_option_tiers for select
  to authenticated
  using (true);

revoke all on table public.hero_option_tiers from anon, authenticated;
grant select on table public.hero_option_tiers to authenticated;

commit;
