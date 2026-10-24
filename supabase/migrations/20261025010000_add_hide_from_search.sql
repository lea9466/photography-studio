-- Per-studio opt-out from search engines, without deleting or hiding the site.
-- true = every public page of the studio is served with noindex/nofollow and
-- the studio is left out of the sitemap (main + custom-domain one). The site
-- itself stays fully reachable by direct link. Toggled by the photographer in
-- /dashboard/settings or by an admin in /manage.

begin;

alter table public.users
  add column if not exists hide_from_search boolean not null default false;

comment on column public.users.hide_from_search is
  'true = keep the public site out of Google (noindex + excluded from sitemap). Site stays reachable by link.';

commit;
