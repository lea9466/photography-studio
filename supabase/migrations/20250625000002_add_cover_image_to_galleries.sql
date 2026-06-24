-- Add cover_image column to galleries table
-- This allows galleries to have a custom cover image for public display

alter table public.galleries 
add column if not exists cover_image text;

-- Add comment
comment on column public.galleries.cover_image is 'Custom cover image URL for public gallery display (only used when is_public = true)';
