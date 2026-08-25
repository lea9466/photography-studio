-- Global public-site rollout kill switch, controlled from /manage.
-- Singleton table: exactly one row (id = 1).

create table if not exists public.app_settings (
  id int primary key default 1,
  react_public_site_enabled boolean not null default false,
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id, react_public_site_enabled)
values (1, false)
on conflict (id) do nothing;

comment on table public.app_settings is
  'Singleton row (id = 1) of app-wide settings/flags controlled from /manage.';
comment on column public.app_settings.react_public_site_enabled is
  'Global kill switch for the React public-site rollout. When true, every studio''s public pages (homepage/portfolio/blog/before-after/gallery-detail) render via the new React theme components for all real visitors. When false, everyone falls back to the old iframe/string-HTML renderer immediately (cached read, ~15s worst case, no redeploy needed).';
