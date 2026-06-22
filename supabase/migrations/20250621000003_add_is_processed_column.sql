-- Add is_processed column to photos table
-- This column tracks whether a photo is regular or processed

alter table public.photos 
  add column if not exists is_processed boolean not null default false;

-- Add index for better query performance on processed photos
create index if not exists photos_is_processed_idx on public.photos(is_processed);
