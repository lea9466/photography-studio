alter table public.users
  add column if not exists posts_display_style text not null default 'cards';

alter table public.users
  drop constraint if exists users_posts_display_style_check;

alter table public.users
  add constraint users_posts_display_style_check
  check (posts_display_style in ('cards', 'circles'));

comment on column public.users.posts_display_style is
  'How blog posts are rendered on the homepage and blog page: cards or circles.';
