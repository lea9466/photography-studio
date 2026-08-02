alter table public.users
  add column if not exists hero_type text not null default 'images',
  add column if not exists hero_video_url text;

alter table public.users
  drop constraint if exists users_hero_type_check;

alter table public.users
  add constraint users_hero_type_check
  check (hero_type in ('images', 'video'));

comment on column public.users.hero_type is
  'Selected public Hero renderer. Assets are retained when switching modes.';

comment on column public.users.hero_video_url is
  'R2 branding-bucket key for the validated Hero MP4.';
