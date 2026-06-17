-- Studio Gallery — Personal Branding and Customization
-- Add branding columns to users table

-- Add new branding columns to users table
alter table public.users
  add column if not exists about_text text,
  add column if not exists stat_projects integer default 0,
  add column if not exists stat_clients integer default 0,
  add column if not exists stat_experience_years integer default 0,
  add column if not exists accent_color varchar default '#7c3aed',
  add column if not exists selected_theme varchar default 'classic',
  add column if not exists hero_desktop_url text,
  add column if not exists hero_mobile_url text,
  add column if not exists about_image_url text;

-- Add comments for documentation
comment on column public.users.about_text is 'About section text for photographer profile';
comment on column public.users.stat_projects is 'Number of projects completed';
comment on column public.users.stat_clients is 'Number of clients served';
comment on column public.users.stat_experience_years is 'Years of experience';
comment on column public.users.accent_color is 'Hex color code for accent elements (buttons, highlights)';
comment on column public.users.selected_theme is 'Selected theme identifier (classic, modern, elegant, bold)';
comment on column public.users.hero_desktop_url is 'Cover image URL for desktop screens';
comment on column public.users.hero_mobile_url is 'Cover image URL for mobile screens';
comment on column public.users.about_image_url is 'Profile/atmosphere image URL for about section';
