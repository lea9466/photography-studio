-- Custom Hebrew title for the galleries section on the public homepage / portfolio page
alter table public.users
  add column if not exists galleries_title text;

comment on column public.users.galleries_title is 'Hebrew title for galleries section on public homepage or portfolio page';
