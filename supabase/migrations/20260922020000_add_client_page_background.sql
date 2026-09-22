-- Light/dark page background for the client-facing gallery page.
-- NULL = no choice made yet, code falls back to 'light' — same default
-- behaviour as before this column existed. See
-- lib/branding/client-page-background.ts for the allowed values.

alter table public.users
  add column if not exists client_page_background text;

alter table public.users
  drop constraint if exists users_client_page_background_check;

alter table public.users
  add constraint users_client_page_background_check
  check (client_page_background is null or client_page_background in ('light', 'dark'));

comment on column public.users.client_page_background is
  'Page background of the client-facing gallery page: light | dark. NULL = light (default).';
