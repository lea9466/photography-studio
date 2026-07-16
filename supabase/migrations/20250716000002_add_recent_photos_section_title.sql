-- Custom Hebrew title for the recent photos section on the public homepage
alter table public.users
  add column if not exists recent_photos_title text;

comment on column public.users.recent_photos_title is 'Hebrew title for recent photos section on public homepage';
