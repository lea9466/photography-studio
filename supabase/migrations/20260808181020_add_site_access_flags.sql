-- Manual site access gates controlled from /manage.
-- Neither flag is auto-driven by subscription yet.

alter table public.users
  add column if not exists is_under_construction boolean not null default false,
  add column if not exists is_site_unavailable boolean not null default false;

comment on column public.users.is_under_construction is
  'When true, public studio pages show an under-construction screen (still indexable).';

comment on column public.users.is_site_unavailable is
  'When true, public studio pages show an unavailable screen. Manual admin control only for now.';
