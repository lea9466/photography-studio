alter table public.users
  add column if not exists site_onboarding_skipped boolean not null default false;

comment on column public.users.site_onboarding_skipped is
  'Photographer chose "private galleries only" in the site-setup onboarding modal — the modal no longer reopens on every entry while slug/hero are missing.';
