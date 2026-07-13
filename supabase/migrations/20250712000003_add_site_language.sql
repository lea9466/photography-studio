alter table public.users
  add column if not exists site_language text not null default 'he'
    check (site_language in ('he', 'en'));

comment on column public.users.site_language is 'Public site display language: he (RTL) or en (LTR)';
