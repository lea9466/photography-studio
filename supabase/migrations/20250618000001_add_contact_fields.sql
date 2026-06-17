-- Studio Gallery — Contact and URL fields
-- Add slug column to users table (email already exists)

-- Add new URL column to users table
alter table public.users
  add column if not exists slug text;

-- Add comments for documentation
comment on column public.users.slug is 'URL slug for the studio public page (e.g., gallery.studio/slug)';
