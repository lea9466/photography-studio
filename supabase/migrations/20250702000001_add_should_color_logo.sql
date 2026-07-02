-- Studio Gallery — Logo Coloring Feature
-- Add should_color_logo field to users table

-- Add should_color_logo column to users table
alter table public.users
  add column if not exists should_color_logo boolean default false;

-- Add comment for documentation
comment on column public.users.should_color_logo is 'Whether to color the logo with the brand accent color (SVG only)';
