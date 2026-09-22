-- Optional small "visit my site" badge on the client-facing gallery page,
-- linking to the studio's own public site. Off by default — an explicit
-- opt-in, and only ever shown when the studio actually has a resolvable
-- public site path (see getPublicSitePath in lib/queries/public-photographer.ts).

alter table public.users
  add column if not exists client_page_show_site_link boolean not null default false;

comment on column public.users.client_page_show_site_link is
  'Whether the client-facing gallery page shows a small badge linking to the studio''s own public site. Default off.';
