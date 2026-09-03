-- Optional call-to-action on a dashboard announcement: a labelled link/button
-- rendered by components/dashboard/AnnouncementBanner. Both null = plain
-- informational banner, same as before.
begin;

alter table public.announcements
  add column cta_label text,
  add column cta_href text;

comment on column public.announcements.cta_href is
  'Internal path ("/dashboard/...") or an https:// URL. Validated in publishAnnouncement.';

commit;
