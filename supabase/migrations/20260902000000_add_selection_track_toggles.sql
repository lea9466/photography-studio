-- Per-gallery toggles to disable a whole selection track.
-- A photographer who builds the album only from retouched photos can turn the
-- "album" track off; one who never retouches can turn the "edit" track off.
-- Both default true, so existing galleries keep today's behaviour.
alter table public.gallery_settings
  add column if not exists album_selection_enabled boolean not null default true,
  add column if not exists edit_selection_enabled boolean not null default true;
