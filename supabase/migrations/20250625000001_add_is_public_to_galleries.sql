-- Add is_public column to galleries table
-- This allows galleries to be displayed on the public website

alter table public.galleries 
add column if not exists is_public boolean not null default false;

-- Add index for faster queries on public galleries
create index if not exists galleries_is_public_idx on public.galleries(is_public) where is_public = true;

-- Add comment
comment on column public.galleries.is_public is 'Whether the gallery should be displayed on the public website (portfolio/showcase)';
