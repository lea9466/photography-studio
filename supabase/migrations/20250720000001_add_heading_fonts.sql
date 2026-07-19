-- Studio Gallery — User-selectable heading fonts
-- Maps to CSS variables --headline-font and --about-title-font

alter table public.users
  add column if not exists heading_font text,
  add column if not exists about_title_font text;

comment on column public.users.heading_font is 'Google Font family name for site headings (--headline-font)';
comment on column public.users.about_title_font is 'Google Font family name for about-section title (--about-title-font)';
