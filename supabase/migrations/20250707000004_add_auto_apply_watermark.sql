alter table public.gallery_settings
  add column if not exists auto_apply_watermark boolean not null default true;
