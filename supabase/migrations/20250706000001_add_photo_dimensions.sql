-- Store image dimensions for homepage landscape preference (lightweight metadata).
alter table public.photos
  add column if not exists width int,
  add column if not exists height int;

comment on column public.photos.width is 'Original image width in pixels (captured on upload)';
comment on column public.photos.height is 'Original image height in pixels (captured on upload)';
