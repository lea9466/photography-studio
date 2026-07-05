-- Packages/pricing section background images (homepage only)
alter table public.users
  add column if not exists packages_desktop_url text,
  add column if not exists packages_mobile_url text;

comment on column public.users.packages_desktop_url is 'Background image for packages section on desktop';
comment on column public.users.packages_mobile_url is 'Background image for packages section on mobile';
