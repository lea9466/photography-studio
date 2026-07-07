-- Custom Hebrew headings for the packages section on the public homepage
alter table public.users
  add column if not exists packages_title text,
  add column if not exists packages_subtitle text;

comment on column public.users.packages_title is 'Hebrew title for packages section on public homepage';
comment on column public.users.packages_subtitle is 'Hebrew subtitle for packages section on public homepage';
