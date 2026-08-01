alter table public.users
  add column if not exists before_after_display_style text not null default 'development';

alter table public.users
  drop constraint if exists users_before_after_display_style_check;

alter table public.users
  add constraint users_before_after_display_style_check
  check (before_after_display_style in ('development', 'split_slider'));

comment on column public.users.before_after_display_style is
  'Site-wide renderer for all before/after photo comparisons.';
