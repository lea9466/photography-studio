-- Add per-post watermark settings

alter table public.posts
  add column watermark_text text,
  add column auto_apply_watermark boolean not null default true;

comment on column public.posts.watermark_text is 'Custom watermark text for post photos';
comment on column public.posts.auto_apply_watermark is 'Whether to apply watermark when uploading post photos';
