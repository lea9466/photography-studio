-- Add is_processed field to photos table
-- This allows distinguishing between regular photos and processed/edited photos

alter table public.photos
add column if not exists is_processed boolean not null default false;

-- Add index for filtering by processed status
create index if not exists photos_is_processed_idx on public.photos(is_processed);
