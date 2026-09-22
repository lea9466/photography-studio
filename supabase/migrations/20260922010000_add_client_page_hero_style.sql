-- Which of the client-facing gallery page's hero layouts a studio picked.
-- NULL = no choice made yet, code falls back to the 'centered' layout — same
-- default behaviour as before this column existed. See
-- lib/branding/client-page-hero-style.ts for the allowed values.

alter table public.users
  add column if not exists client_page_hero_style text;

alter table public.users
  drop constraint if exists users_client_page_hero_style_check;

alter table public.users
  add constraint users_client_page_hero_style_check
  check (client_page_hero_style is null or client_page_hero_style in ('centered', 'bottom_right', 'below_photo'));

comment on column public.users.client_page_hero_style is
  'Layout of the client-facing gallery page hero: centered | bottom_right | below_photo. NULL = centered (default).';
